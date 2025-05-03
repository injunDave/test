import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { GetPaymentStatusInput, GetPaymentStatusOutput, InitiatePaymentInput, InitiatePaymentOutput, ProviderWebhookPayload, RefundPaymentInput, RefundPaymentOutput, UpdatePaymentInput, UpdatePaymentOutput, WebhookActionResult } from "@medusajs/types";
import { v4 as uuidv4 } from 'uuid';

import { AuthorizePaymentInput, AuthorizePaymentOutput } from "@medusajs/types";
const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createTransferCheckedInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58');
import { Logger } from "@medusajs/framework/types"

type Options = {

  apiKey: string
  merchantUsdcWallet: string, 
  merchantUsdtWallet: string,
  network: string, // "mainnet" or "devnet"
  merchantPrivateKey: string, // Merchant's private key for signing transactions
  publishableKey: string, // Publishable key for client-side
}


type InjectedDependencies = {
  logger: Logger
}


export class solanaProvider extends AbstractPaymentProvider<Options> {
  getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    throw new Error("Method not implemented.");
  }
  getWebhookActionAndData(data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    throw new Error("Method not implemented.");
  }

  static identifier = "USDC-SOLANA" // This is required
  options: any;
    merchantUsdcWallet: any;
    merchantUsdtWallet: any;
    merchantPrivateKey: any;
    network: any;
    connection: any;
    tokenMints: {
        usdc: any; // Mainnet USDC
        usdt: any; // Mainnet USDT
    };
  constructor(container: InjectedDependencies,

    options: Options) {
    super(options);
    // Save the options
    this.options = options;
    
    // Get the merchant wallet addresses and private keys from options
    this.merchantUsdcWallet = options.merchantUsdcWallet;
    this.merchantUsdtWallet = options.merchantUsdtWallet;
    
    // IMPORTANT: In production, use a secure way to manage private keys
    // This is for demonstration purposes only
    this.merchantPrivateKey = options.merchantPrivateKey;
    
    // Initialize Solana connection
    this.network = options.network || "devnet";
    this.connection = new Connection(
      this.network === "mainnet" 
        ? "https://api.mainnet-beta.solana.com" 
        : "https://api.devnet.solana.com",
      'confirmed'
    );
    
    // Token mint addresses
    this.tokenMints = {
      usdc: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // Mainnet USDC
      usdt: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")  // Mainnet USDT
    };
    
    // For devnet testing, use different mint addresses
    if (this.network === "devnet") {
      // These would be your devnet test tokens
      this.tokenMints.usdc = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"); // Example devnet USDC-like token
      this.tokenMints.usdt = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"); // Example devnet USDT-like token
    }
  }

  /**
   * Return the payment provider identifier
   */
  getIdentifier() {
    return "solana-usdc-usdt";
  }

  /**
   * Initialize a payment session for checkout
   */
  async initiatePayment(

    input: InitiatePaymentInput

  ): Promise<InitiatePaymentOutput> {

    const {

      amount,

      currency_code,

      context: customerDetails

    } = input

    const customerWallet = (customerDetails as any)?.customer_wallet; // Cast or adjust type if necessary
    this.executeTransfer(customerWallet, "usdc", amount);

    return {

      id: 'solana-payment-' + uuidv4(),

      data: {},

    }

  }

  /**
   * Execute a transfer on the Solana blockchain
   * This is called when the payment is authorized
   */
  async executeTransfer(customerWallet, tokenType, amount) {
    try {
      // Convert amount from cents to token units (USDC/USDT have 6 decimals)
      const tokenAmount = Math.round(amount / 100 * 1000000); // Convert from cents to token units
      
      // Get the token mint based on selected token
      const tokenMint = this.tokenMints[tokenType.toLowerCase()];
      
      // Create a keypair from the merchant's private key
      const merchantKeypair = Keypair.fromSecretKey(
        bs58.decode(this.merchantPrivateKey)
      );
      
      // Get the customer's public key
      const customerPublicKey = new PublicKey(customerWallet);
      
      // Get the associated token accounts
      const customerTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        customerPublicKey
      );
      
      const merchantTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        merchantKeypair.publicKey
      );
      
      // Create the transfer instruction
      const transferInstruction = createTransferCheckedInstruction(
        merchantTokenAccount,
        tokenMint,
        customerTokenAccount,
        merchantKeypair.publicKey,
        tokenAmount,
        6 // USDC and USDT have 6 decimals on Solana
      );
      
      // Create and sign the transaction
      const transaction = new Transaction().add(transferInstruction);
      transaction.feePayer = merchantKeypair.publicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      
      // Sign the transaction
      transaction.sign(merchantKeypair);
      
      // Send the transaction
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );
      
      // Wait for confirmation
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      return {
        success: true,
        signature,
        amount: tokenAmount,
        tokenType
      };
    } catch (error) {
      console.error("Transfer error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify a Solana transaction
   */
  async verifyTransaction(signature) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      });
      
      if (!transaction) {
        return false;
      }
      
      // Check if transaction is confirmed
      if (!transaction.meta || transaction.meta.err) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Transaction verification error:", error);
      return false;
    }
  }


  /**
   * Authorize a payment session
   * This is where we'll execute the blockchain transfer
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const paymentSessionData = input.data; // Adjusted to use the correct property from AuthorizePaymentInput
    const customer_wallet = paymentSessionData?.customer_wallet ?? null;
    
    if (!customer_wallet) {
      return {
        status: "error",
        data: {
          error: "Customer wallet address is missing",
        },
      };
    }
    
    const token_type = "usdc";
    // Add your authorization logic here
    
    return {
      status: "authorized", // Replace with a valid PaymentSessionStatus value
      data: {
        customer_wallet,
        token_type,
      },
    };
  }

  /**
   * Capture a payment
   */
  async capturePayment(paymentSessionData) {
    // For crypto payments, authorization and capture are typically the same
    // Once the blockchain transaction is confirmed, the payment is captured
    return {
      ...paymentSessionData,
      status: "captured",
    };
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentSessionData) {
    // For crypto payments, cancellation typically means we just mark it as cancelled
    // The actual blockchain transaction cannot be reversed
    return {
      ...paymentSessionData,
      status: "canceled",
    };
  }

  /**
   * Refund a payment
   * This will create a new transaction to refund the customer
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const paymentSessionData = input.data;
    const refundAmount = input.amount;
  
    // Example: Check for required data
    if (!paymentSessionData?.customer_wallet) {
      return {
        data: {
          error: "Customer wallet address not found",
          status: "error",
        },
      };
    }
  
    try {
      // Your Solana-specific refund logic (replace with actual implementation)
    
  
      return {
        data: {
          result: "success", // Adjusted to include a valid property
        },
      };
    } catch (error) {
      return {
        data: { error: error.message, result: "error" },
      };
    }
  }

  /**
   * Retrieve payment data
   */
  async retrievePayment(paymentSessionData) {
    // Return the current payment session data
    return paymentSessionData;
  }

  /**
   * Update payment data
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const { amount, currency_code } = input;

    // Update the payment session with new amount
    return {
      data: {
        ...input.data,
        amount,
        currency_code,
        updated_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Delete payment
   */
  async deletePayment(paymentSessionData) {
    return {
      ...paymentSessionData,
      deleted: true,
    };
  }
}


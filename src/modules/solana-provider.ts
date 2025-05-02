const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createTransferCheckedInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58');

class SolanaPaymentProvider {
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
  constructor({}, options) {
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
  async initiatePayment(context) {
    try {
      const { currency_code, amount } = context.amount;
      
      // Only accept USD as the currency
      if (currency_code.toLowerCase() !== "usd") {
        throw new Error("Solana payment provider only supports USD");
      }
      
      // Create data needed for the payment session
      return {
        session_data: {
          merchantUsdcWallet: this.merchantUsdcWallet,
          merchantUsdtWallet: this.merchantUsdtWallet,
          amount: amount,
          status: "pending",
          created_at: new Date().toISOString(),
          currency_code,
          usdcMint: this.tokenMints.usdc.toString(),
          usdtMint: this.tokenMints.usdt.toString(),
        }
      };
    } catch (error) {
      throw error;
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
  async authorizePayment(paymentSessionData, context) {
    try {
      // Get customer wallet address from the context
      const { customer_wallet, token_type = "usdc" } = context;
      
      if (!customer_wallet) {
        return {
          status: "error",
          data: {
            ...paymentSessionData,
            status: "error",
            error: "Customer wallet address is required",
          }
        };
      }
      
      // Execute the transfer on the blockchain
      const transferResult = await this.executeTransfer(
        customer_wallet,
        token_type,
        paymentSessionData.amount
      );
      
      if (transferResult.success) {
        // Verify the transaction
        const isVerified = await this.verifyTransaction(transferResult.signature);
        
        if (isVerified) {
          return {
            status: "authorized",
            data: {
              ...paymentSessionData,
              status: "authorized",
              transaction_signature: transferResult.signature,
              token_type: transferResult.tokenType,
              transaction_verified: true,
            }
          };
        }
      }
      
      return {
        status: "error",
        data: {
          ...paymentSessionData,
          status: "error",
          error: transferResult.error || "Transaction failed",
        }
      };
    } catch (error) {
      return {
        status: "error",
        data: {
          ...paymentSessionData,
          status: "error",
          error: error.message,
        }
      };
    }
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
  async refundPayment(paymentSessionData, refundAmount) {
    try {
      // Check if we have the customer wallet address
      if (!paymentSessionData.customer_wallet) {
        return {
          ...paymentSessionData,
          status: "requires_manual_refund",
          refund_amount: refundAmount,
          refund_note: "Customer wallet address not found. Please process manual refund.",
        };
      }
      
      // Execute a transfer back to the customer
      const transferResult = await this.executeTransfer(
        paymentSessionData.customer_wallet,
        paymentSessionData.token_type || "usdc",
        refundAmount
      );
      
      if (transferResult.success) {
        return {
          ...paymentSessionData,
          status: "refunded",
          refund_amount: refundAmount,
          refund_transaction_signature: transferResult.signature,
        };
      } else {
        return {
          ...paymentSessionData,
          status: "requires_manual_refund",
          refund_amount: refundAmount,
          refund_error: transferResult.error,
          refund_note: "Automatic refund failed. Please process manual refund.",
        };
      }
    } catch (error) {
      return {
        ...paymentSessionData,
        status: "requires_manual_refund",
        refund_amount: refundAmount,
        refund_error: error.message,
        refund_note: "Automatic refund failed. Please process manual refund.",
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
  async updatePayment(context) {
    const { amount, currency_code } = context.amount;
    
    // Update the payment session with new amount
    return {
      session_data: {
        ...context.paymentSessionData,
        amount,
        currency_code,
        updated_at: new Date().toISOString(),
      }
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

module.exports = SolanaPaymentProvider;
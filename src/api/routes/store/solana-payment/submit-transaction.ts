module.exports = async (req, res) => {
    const { cart_id, customer_wallet, token_type = "usdc", publishable_key } = req.body;
    
    if (!cart_id || !customer_wallet) {
      return res.status(400).json({
        error: "Missing required parameters: cart_id or customer_wallet"
      });
    }
    
    try {
      console.log(`🔄 Processing Solana payment for cart ${cart_id}`);
      
      const paymentProviderService = req.scope.resolve("paymentProviderService");
      const solanaProvider = paymentProviderService.retrieveProvider("USDC-SOLANA");
      
      if (!solanaProvider) {
        return res.status(404).json({ error: "Solana payment provider not found" });
      }
      
      // Verify the publishable key
      const settings = solanaProvider.getPaymentProviderSettings();
      if (publishable_key !== settings.publishableKey) {
        return res.status(401).json({ error: "Invalid publishable key" });
      }
      
      const cartService = req.scope.resolve("cartService");
      const cart = await cartService.retrieve(cart_id);
      
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
      
      // Get the payment session for Solana provider
      const paymentSession = cart.payment_session;
      
      if (!paymentSession || paymentSession.provider_id !== "solana-usdc-usdt") {
        return res.status(400).json({ 
          error: "No active Solana payment session found for this cart" 
        });
      }
      
      // Update the payment session with the customer wallet
      await cartService.setPaymentSession(cart_id, "solana-usdc-usdt");
      
      // Authorize the payment with the customer wallet
      const { data } = await cartService.authorizePayment(cart_id, {
        customer_wallet,
        token_type
      });
      
      console.log(`✅ Payment processed successfully for cart ${cart_id}`);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error(`❌ Error processing payment: ${error.message}`);
      return res.status(500).json({
        error: "An error occurred while processing the payment",
        details: error.message
      });
    }
  };
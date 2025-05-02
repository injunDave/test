module.exports = async (req, res) => {
    const { cart_id, customer_wallet, token_type = "usdc" } = req.body;
    
    if (!cart_id || !customer_wallet) {
      return res.status(400).json({
        error: "Missing required parameters: cart_id or customer_wallet"
      });
    }
    
    try {
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
      
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({
        error: "An error occurred while processing the payment",
        details: error.message
      });
    }
  };
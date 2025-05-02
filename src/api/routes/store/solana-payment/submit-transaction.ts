// CommonJS format
module.exports = async (req, res) => {
    const { cart_id, transaction_signature, token_type } = req.body
    
    if (!cart_id || !transaction_signature || !token_type) {
      return res.status(400).json({
        error: "Missing required parameters: cart_id, transaction_signature, or token_type"
      })
    }
    
    try {
      const cartService = req.scope.resolve("cartService")
      const cart = await cartService.retrieve(cart_id)
      
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" })
      }
      
      // Get the payment session for Solana provider
      const paymentSession = cart.payment_session
      
      if (!paymentSession || paymentSession.provider_id !== "solana-usdc-usdt") {
        return res.status(400).json({ 
          error: "No active Solana payment session found for this cart" 
        })
      }
      
      // Update the payment session with the transaction signature
      await cartService.setPaymentSession(cart_id, "solana-usdc-usdt")
      
      // Update the payment session data with the transaction signature
      await cartService.updatePaymentSession(cart_id, {
        transactionSignature: transaction_signature,
        tokenType: token_type, // "usdc" or "usdt"
      })
      
      // Complete the cart to create an order
      const { data } = await cartService.authorizePayment(cart_id, {})
      
      return res.status(200).json({ success: true, data })
    } catch (error) {
      return res.status(500).json({
        error: "An error occurred while processing the payment",
        details: error.message
      })
    }
  }
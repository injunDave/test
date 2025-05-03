import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    
    databaseDriverOptions: {
      connection: {
        ssl: {
          rejectUnauthorized: false, // Required for Heroku's self-signed certificates
        }
      }
    },
    
    http: {
      storeCors: "/vercel\\.app$/",
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [

    {

      resolve: "@medusajs/medusa/payment",

      options: {

        providers: [

          {
            resolve: "./src/modules/solona-provider/index.ts",
            id: "solona-provider",
            options: {
              merchantUsdcWallet: process.env.SOLANA_MERCHANT_USDC_WALLET,
              merchantUsdtWallet: process.env.SOLANA_MERCHANT_USDT_WALLET,
              network: process.env.NODE_ENV === "production" ? "mainnet" : "devnet"
            }

          }

        ]

      }

    }

  ]
})

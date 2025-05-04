import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Log environment variables to Heroku logs
console.log("Environment Variables:");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("STORE_CORS:", process.env.STORE_CORS);
console.log("ADMIN_CORS:", process.env.ADMIN_CORS);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("COOKIE_SECRET:", process.env.COOKIE_SECRET);
console.log("SOLANA_MERCHANT_USDC_WALLET:", process.env.SOLANA_MERCHANT_USDC_WALLET);
console.log("SOLANA_MERCHANT_USDT_WALLET:", process.env.SOLANA_MERCHANT_USDT_WALLET);
console.log("REDIS_URL:", process.env.REDIS_URL);

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: (["shared", "worker", "server"].includes(process.env.WORKER_MODE || "") 
      ? process.env.WORKER_MODE 
      : "shared") as "shared" | "worker" | "server" | undefined,
    databaseDriverOptions: {
      connection: {
        ssl: {
          rejectUnauthorized: false, // Required for Heroku's self-signed certificates
        }
      }
    },
    
    http: {
      // Allow requests from the frontend origin
      storeCors: process.env.STORE_CORS || "https://dev-virid-seven.vercel.app",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7000",
      authCors: process.env.AUTH_CORS || "http://localhost:3000",
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
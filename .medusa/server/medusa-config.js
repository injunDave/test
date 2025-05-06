"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
(0, utils_1.loadEnv)(process.env.NODE_ENV || 'development', process.cwd());
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
module.exports = (0, utils_1.defineConfig)({
    projectConfig: {
        databaseUrl: process.env.DATABASE_URL,
        redisUrl: process.env.REDIS_URL,
        workerMode: (["shared", "worker", "server"].includes(process.env.WORKER_MODE || "")
            ? process.env.WORKER_MODE
            : "shared"),
        databaseDriverOptions: {
            connection: {
                ssl: {
                    rejectUnauthorized: false, // Required for Heroku's self-signed certificates
                }
            }
        },
        // Removed invalid 'admin' property
        http: {
            // Allow requests from the frontend origin
            storeCors: process.env.STORE_CORS || "https://dev-virid-seven.vercel.app",
            adminCors: process.env.ADMIN_CORS || "http://localhost:7000",
            authCors: process.env.AUTH_CORS || "http://localhost:3002",
            jwtSecret: process.env.JWT_SECRET || "supersecret",
            cookieSecret: process.env.COOKIE_SECRET || "supersecret",
        }
    },
    modules: [
        {
            resolve: '@medusajs/file-local', // v2 local‑disk provider
            options: {
                upload_dir: 'static', // keep your uploads in /static
                backend_url: '/static' // <─ this is the bit that removes the host
                //   ↳ could also be 'https://api.my‑domain.com/static' if you prefer an absolute URL
            }
        },
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
        },
    ]
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBaUU7QUFFakUsSUFBQSxlQUFPLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0FBRTdELDJDQUEyQztBQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUVqRCxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUEsb0JBQVksRUFBQztJQUM1QixhQUFhLEVBQUU7UUFDYixXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZO1FBQ3JDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVM7UUFDL0IsVUFBVSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUM7WUFDakYsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVztZQUN6QixDQUFDLENBQUMsUUFBUSxDQUErQztRQUMzRCxxQkFBcUIsRUFBRTtZQUNyQixVQUFVLEVBQUU7Z0JBQ1YsR0FBRyxFQUFFO29CQUNILGtCQUFrQixFQUFFLEtBQUssRUFBRSxpREFBaUQ7aUJBQzdFO2FBQ0Y7U0FDRjtRQUNELG1DQUFtQztRQUNuQyxJQUFJLEVBQUU7WUFDSiwwQ0FBMEM7WUFDMUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLG9DQUFvQztZQUN6RSxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksdUJBQXVCO1lBQzVELFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSx1QkFBdUI7WUFDMUQsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLGFBQWE7WUFDbEQsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLGFBQWE7U0FDekQ7S0FDRjtJQUNELE9BQU8sRUFBRTtRQUNQO1lBQ0UsT0FBTyxFQUFFLHNCQUFzQixFQUFPLHlCQUF5QjtZQUMvRCxPQUFPLEVBQUU7Z0JBQ1AsVUFBVSxFQUFFLFFBQVEsRUFBZ0IsK0JBQStCO2dCQUNuRSxXQUFXLEVBQUUsU0FBUyxDQUFjLDJDQUEyQztnQkFDL0UscUZBQXFGO2FBQ3RGO1NBQ0Y7UUFDRDtZQUVFLE9BQU8sRUFBRSwwQkFBMEI7WUFFbkMsT0FBTyxFQUFFO2dCQUVQLFNBQVMsRUFBRTtvQkFFVDt3QkFDRSxPQUFPLEVBQUUsd0NBQXdDO3dCQUNqRCxFQUFFLEVBQUUsaUJBQWlCO3dCQUNyQixPQUFPLEVBQUU7NEJBQ1Asa0JBQWtCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkI7NEJBQzNELGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCOzRCQUMzRCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVE7eUJBQ3RFO3FCQUVGO2lCQUVGO2FBRUY7U0FFRjtLQUdGO0NBQ0YsQ0FBQyxDQUFBIn0=
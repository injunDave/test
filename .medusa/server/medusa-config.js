"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
(0, utils_1.loadEnv)(process.env.NODE_ENV || 'development', process.cwd());
module.exports = (0, utils_1.defineConfig)({
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
            storeCors: process.env.STORE_CORS,
            adminCors: process.env.ADMIN_CORS,
            authCors: process.env.AUTH_CORS,
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
                        resolve: "/src/services/solana-provider",
                        id: "my-payment",
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBaUU7QUFFakUsSUFBQSxlQUFPLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0FBRTdELE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBQSxvQkFBWSxFQUFDO0lBQzVCLGFBQWEsRUFBRTtRQUNiLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7UUFFckMscUJBQXFCLEVBQUU7WUFDckIsVUFBVSxFQUFFO2dCQUNWLEdBQUcsRUFBRTtvQkFDSCxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsaURBQWlEO2lCQUM3RTthQUNGO1NBQ0Y7UUFFRCxJQUFJLEVBQUU7WUFDSixTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXO1lBQ2xDLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVc7WUFDbEMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBVTtZQUNoQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksYUFBYTtZQUNsRCxZQUFZLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksYUFBYTtTQUN6RDtLQUNGO0lBQ0QsT0FBTyxFQUFFO1FBRVA7WUFFRSxPQUFPLEVBQUUsMEJBQTBCO1lBRW5DLE9BQU8sRUFBRTtnQkFFUCxTQUFTLEVBQUU7b0JBRVQ7d0JBQ0UsT0FBTyxFQUFFLCtCQUErQjt3QkFDeEMsRUFBRSxFQUFFLFlBQVk7d0JBQ2hCLE9BQU8sRUFBRTs0QkFDUCxrQkFBa0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQjs0QkFDM0Qsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkI7NEJBQzNELE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUTt5QkFDdEU7cUJBRUY7aUJBRUY7YUFFRjtTQUVGO0tBRUY7Q0FDRixDQUFDLENBQUEifQ==
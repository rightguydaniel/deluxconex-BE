// import {
//   ApiError,
//   CheckoutPaymentIntent,
//   Client,
//   Environment,
//   LogLevel,
//   OrdersController,
//   PaymentsController,
//   PaypalExperienceLandingPage,
//   PaypalExperienceUserAction,
//   ShippingPreference,
// } from "@paypal/paypal-server-sdk";
// import dotenv from "dotenv";
// dotenv.config();

// const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE } = process.env;
// const client = new Client({
//   clientCredentialsAuthCredentials: {
//     oAuthClientId: PAYPAL_CLIENT_ID || (() => { throw new Error("PAYPAL_CLIENT_ID is not defined in environment variables."); })(),
//     oAuthClientSecret: PAYPAL_CLIENT_SECRET || (() => { throw new Error("PAYPAL_CLIENT_SECRET is not defined in environment variables."); })(),
//   },
//   timeout: 0,
//   environment: Environment.Sandbox,
//   logging: {
//     logLevel: LogLevel.Info,
//     logRequest: { logBody: true },
//     logResponse: { logHeaders: true },
//   },
// });
// const ordersController = new OrdersController(client);

// const paymentsController = new PaymentsController(client);
// // Configure PayPal environment
// const configureEnvironment = function () {
//   const clientId = process.env.PAYPAL_CLIENT_ID;
//   const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

//   if (!clientId || !clientSecret) {
//     throw new Error(
//       "PayPal client ID and secret must be defined in environment variables."
//     );
//   }

//   if (process.env.NODE_ENV === "production") {
//     return new paypal.core.LiveEnvironment(clientId, clientSecret);
//   } else {
//     return new paypal.core.SandboxEnvironment(clientId, clientSecret);
//   }
// };

// export const processPayPalPayment = async (order: any, cardDetails: any) => {
//   try {
//     const request = new paypal.orders.OrdersCreateRequest();

//     request.requestBody({
//       intent: "CAPTURE",
//       purchase_units: [
//         {
//           amount: {
//             currency_code: "USD",
//             value: order.total.toFixed(2),
//             breakdown: {
//               item_total: {
//                 currency_code: "USD",
//                 value: order.subtotal.toFixed(2),
//               },
//               shipping: {
//                 currency_code: "USD",
//                 value: order.shipping.toFixed(2),
//               },
//               tax_total: {
//                 currency_code: "USD",
//                 value: order.tax.toFixed(2),
//               },
//               discount: {
//                 currency_code: "USD",
//                 value: "0.00", // Default value for discount
//               },
//               handling: {
//                 currency_code: "USD",
//                 value: "0.00", // Default value for handling
//               },
//               insurance: {
//                 currency_code: "USD",
//                 value: "0.00", // Default value for insurance
//               },
//               shipping_discount: {
//                 currency_code: "USD",
//                 value: "0.00", // Default value for shipping discount
//               },
//             },
//           },
//           items: order.items.map((item: any) => ({
//             name: item.name,
//             unit_amount: {
//               currency_code: "USD",
//               value: item.itemPrice.toFixed(2),
//             },
//             quantity: item.quantity.toString(),
//             description: `${item.dimension} ${item.condition} container`,
//           })),
//           description: `Order #${order.id} - Shipping Containers`,
//         },
//       ],
//       payment_source: {
//         card: {
//           name: cardDetails.cardHolderName,
//           number: cardDetails.cardNumber,
//           expiry: cardDetails.expiryDate.replace("/", ""),
//           security_code: cardDetails.cvv,
//           billing_address: {
//             address_line_1:
//               cardDetails.billingAddress?.street ||
//               order.shippingAddress.street,
//             admin_area_2:
//               cardDetails.billingAddress?.city || order.shippingAddress.city,
//             admin_area_1:
//               cardDetails.billingAddress?.state || order.shippingAddress.state,
//             postal_code:
//               cardDetails.billingAddress?.postalCode ||
//               order.shippingAddress.postalCode,
//             country_code:
//               cardDetails.billingAddress?.country ||
//               order.shippingAddress.country ||
//               "US",
//           },
//         },
//       },
//     });

//     const response = await client().execute(request);

//     // If order was created successfully, capture the payment
//     if (response.result.status === "CREATED") {
//       const captureRequest = new paypal.orders.OrdersCaptureRequest(
//         response.result.id
//       );
//       const captureResponse = await client().execute(captureRequest);

//       if (captureResponse.result.status === "COMPLETED") {
//         return {
//           success: true,
//           transactionId: captureResponse.result.id,
//           status: captureResponse.result.status,
//           paymentDetails: captureResponse.result,
//         };
//       } else {
//         return {
//           success: false,
//           error: "Payment not completed",
//           details: captureResponse.result,
//         };
//       }
//     } else {
//       return {
//         success: false,
//         error: "Order creation failed",
//         details: response.result,
//       };
//     }
//   } catch (error: any) {
//     console.error("PayPal payment error:", error);
//     return {
//       success: false,
//       error: error.message,
//       details: error,
//     };
//   }
// };

import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { database } from "../configs/database/database";
import Orders, { OrderStatus } from "../models/orders";
import Invoices, { InvoiceStatus } from "../models/invoices";
import Carts from "../models/carts";
import Addresses from "../models/addresses";
import Users from "../models/users";
import PaymentRequests, {
  WirePaymentStatus,
} from "../models/paymentRequests";
import sendResponse from "../utils/sendResponse";
import { sendEmail } from "../configs/email/emailConfig";
import { encryptPayload, decryptPayload } from "../utils/wireEncryption";
import path from "path";
import fs from "fs";

const APP_BASE_URL = (process.env.APP_URL || "https://deluxconex.com").replace(
  /\/+$/,
  ""
);

function getPaymentProofDir() {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "payments");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

export const requestWirePayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return sendResponse(res, 401, "Authentication required");
    }

    const cartRow: any = await Carts.findOne({ where: { userId } });
    if (!cartRow || !cartRow.items?.length) {
      return sendResponse(res, 400, "Cart is empty");
    }

    const address: any = await Addresses.findOne({
      where: { userId, isDefault: true },
    });
    if (!address) {
      return sendResponse(res, 200, "address required");
    }

    const cart =
      typeof cartRow.items === "string"
        ? { ...cartRow, items: JSON.parse(cartRow.items) }
        : { ...cartRow, items: cartRow.items };

    const orderId = uuidv4();
    const invoiceId = uuidv4();

    const user = await Users.findByPk(userId);

    await database.transaction(async (t) => {
      const shippingAddress = {
        street: address?.street,
        city: address?.city,
        state: address?.state,
        postalCode: address?.postalCode,
        country: address?.country,
      };

      await Orders.create(
        {
          id: orderId,
          userId,
          items: cart.items.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            price: item.itemPrice,
            quantity: item.quantity,
            dimension: item.selectedDimension?.dimension,
            deliveryMethod: item.selectedDelivery?.method,
            deliveryPrice: item.selectedDelivery?.price || 0,
            image: item.image,
          })),
          subtotal: cart.subtotal,
          shipping: cart.shipping ?? 0,
          tax: cart.tax ?? 0,
          total: cart.total,
          status: OrderStatus.PENDING,
          shippingAddress,
          paymentMethod: "wire",
          paymentStatus: "pending",
        },
        { transaction: t }
      );

      await Invoices.create(
        {
          id: invoiceId,
          userId,
          orderId,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: InvoiceStatus.DRAFT,
          subtotal: cart.subtotal,
          tax: cart.tax ?? 0,
          shipping: cart.shipping ?? 0,
          discount: 0,
          total: cart.total,
          notes: "Wire transfer requested",
          terms: "Payment due within 30 days or as specified.",
        },
        { transaction: t }
      );

      await PaymentRequests.create(
        {
          id: uuidv4(),
          userId,
          orderId,
          invoiceId,
          status: WirePaymentStatus.PENDING,
        },
        { transaction: t }
      );
    });

    if (user?.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="background:#071623;padding:16px 24px;">
              <img src="${APP_BASE_URL}/src/assets/images/Deluxconex.png" alt="DeluxConex" style="height:40px;display:block;">
            </div>
            <div style="padding:24px;">
              <h2 style="margin-top:0;color:#071623;">Wire transfer request received</h2>
              <p style="color:#444;">Hi ${
                user.full_name || user.user_name || ""
              },</p>
              <p style="color:#444;line-height:1.6;">
                We’ve received your request to pay for your order via wire transfer.
                Our team will prepare a secure payment link with bank details and send it to you shortly.
              </p>
              <p style="color:#444;line-height:1.6;">
                Once you receive the link, you’ll be able to view the payment details and optionally upload your proof of payment.
              </p>
              <p style="color:#444;line-height:1.6;">
                If you have any questions, please contact us at
                <a href="mailto:admin@deluxconex.com">admin@deluxconex.com</a>.
              </p>
              <p style="margin-top:24px;color:#777;font-size:12px;">
                This email was sent by DeluxConex. If you did not initiate this request, please contact support immediately.
              </p>
            </div>
          </div>
        </div>
      `;

      await sendEmail(
        user.email,
        "Wire transfer request received",
        undefined,
        html
      );
    }

    return sendResponse(
      res,
      200,
      "Wire transfer request created. A payment link will be sent shortly."
    );
  } catch (error: any) {
    console.error("requestWirePayment error:", error);
    return sendResponse(
      res,
      500,
      "Failed to create wire payment request",
      null,
      error.message
    );
  }
};

export const listPaymentRequests = async (req: Request, res: Response) => {
  try {
    const requests = await PaymentRequests.findAll({
      order: [["createdAt", "DESC"]],
    });
    return sendResponse(res, 200, "Payment requests fetched", requests);
  } catch (error: any) {
    console.error("listPaymentRequests error:", error);
    return sendResponse(
      res,
      500,
      "Failed to fetch payment requests",
      null,
      error.message
    );
  }
};

export const issueWirePaymentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      accountName,
      accountNumber,
      routingNumber,
      bankName,
      daysValid,
    } = req.body as {
      accountName?: string;
      accountNumber?: string;
      routingNumber?: string;
      bankName?: string;
      daysValid?: number;
    };

    const requestRow: any = await PaymentRequests.findByPk(id);
    if (!requestRow) {
      return sendResponse(res, 404, "Payment request not found");
    }

    const invoice: any = await Invoices.findByPk(requestRow.invoiceId);
    const user: any = await Users.findByPk(requestRow.userId);
    if (!invoice || !user) {
      return sendResponse(
        res,
        400,
        "Unable to load associated invoice or user"
      );
    }

    const days = daysValid && daysValid > 0 ? daysValid : 2;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const payload = {
      requestId: requestRow.id,
      invoiceId: invoice.id,
      orderId: requestRow.orderId,
      userId: user.id,
      accountName,
      accountNumber,
      routingNumber,
      bankName,
      total: invoice.total,
      currency: "USD",
      expiresAt: expiresAt.toISOString(),
    };

    const token = encryptPayload(payload);
    const link = `${APP_BASE_URL}/payment/wire?token=${encodeURIComponent(
      token
    )}`;

    await requestRow.update({
      status: WirePaymentStatus.ISSUED,
      accountName,
      accountNumber,
      routingNumber,
      bankName,
      expiresAt,
      linkToken: token,
    });

    if (user.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="background:#071623;padding:16px 24px;">
              <img src="${APP_BASE_URL}/src/assets/images/Deluxconex.png" alt="DeluxConex" style="height:40px;display:block;">
            </div>
            <div style="padding:24px;">
              <h2 style="margin-top:0;color:#071623;">Your wire transfer instructions</h2>
              <p style="color:#444;">Hi ${
                user.full_name || user.user_name || ""
              },</p>
              <p style="color:#444;line-height:1.6;">
                We’ve prepared your wire transfer details. Please use the secure link below
                to view the payment instructions and optionally upload your proof of payment:
              </p>
              <p style="margin:24px 0;">
                <a href="${link}" style="display:inline-block;padding:12px 20px;background:#071623;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;">
                  View wire transfer details
                </a>
              </p>
              <p style="color:#444;line-height:1.6;">
                This link will expire on <strong>${expiresAt.toDateString()}</strong>.
              </p>
              <p style="color:#444;line-height:1.6;">
                If you have already paid, you can upload your payment receipt through the page
                or send it directly to <a href="mailto:admin@deluxconex.com">admin@deluxconex.com</a>.
              </p>
            </div>
          </div>
        </div>
      `;

      await sendEmail(
        user.email,
        "Wire transfer payment instructions",
        undefined,
        html
      );
    }

    return sendResponse(res, 200, "Wire details issued successfully", {
      link,
      expiresAt,
    });
  } catch (error: any) {
    console.error("issueWirePaymentDetails error:", error);
    return sendResponse(
      res,
      500,
      "Failed to issue wire details",
      null,
      error.message
    );
  }
};

export const getWirePaymentInfo = async (req: Request, res: Response) => {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      return sendResponse(res, 400, "Missing token");
    }

    const payload = decryptPayload<any>(token);
    const expiresAt = new Date(payload.expiresAt);
    if (expiresAt.getTime() < Date.now()) {
      return sendResponse(res, 410, "Payment link has expired");
    }

    return sendResponse(res, 200, "Wire payment info", {
      accountName: payload.accountName,
      accountNumber: payload.accountNumber,
      routingNumber: payload.routingNumber,
      bankName: payload.bankName,
      total: payload.total,
      currency: payload.currency,
      expiresAt: payload.expiresAt,
      requestId: payload.requestId,
      invoiceId: payload.invoiceId,
      orderId: payload.orderId,
    });
  } catch (error: any) {
    console.error("getWirePaymentInfo error:", error);
    return sendResponse(
      res,
      400,
      "Invalid or corrupted token",
      null,
      error.message
    );
  }
};

export const uploadWirePaymentProof = async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) {
      return sendResponse(res, 400, "Missing token");
    }

    const payload = decryptPayload<any>(token);
    const expiresAt = new Date(payload.expiresAt);
    if (expiresAt.getTime() < Date.now()) {
      return sendResponse(res, 410, "Payment link has expired");
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    let proofUrl: string | undefined;

    if (file) {
      const dir = getPaymentProofDir();
      const ext =
        path.extname(file.originalname || "") ||
        path.extname(file.filename || "") ||
        ".pdf";
      const filename = `proof_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}${ext}`;
      const absPath = path.join(dir, filename);
      fs.writeFileSync(absPath, file.buffer);
      proofUrl = `${APP_BASE_URL}/uploads/payments/${filename}`;
    }

    const requestRow: any = await PaymentRequests.findByPk(payload.requestId);
    if (!requestRow) {
      return sendResponse(res, 404, "Payment request not found");
    }

    await requestRow.update({
      status: WirePaymentStatus.PROOF_SUBMITTED,
      proofUrl: proofUrl ?? requestRow.proofUrl,
    });

    const invoice: any = await Invoices.findByPk(payload.invoiceId);
    const order: any = await Orders.findByPk(payload.orderId);
    const user: any = await Users.findByPk(payload.userId);

    if (invoice) {
      await invoice.update({
        status: InvoiceStatus.SENT,
      });
    }
    if (order) {
      await order.update({
        paymentStatus: "pending",
        status: OrderStatus.PENDING,
      });
    }

    if (user?.email) {
      const htmlUser = `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="background:#071623;padding:16px 24px;">
              <img src="${APP_BASE_URL}/src/assets/images/Deluxconex.png" alt="DeluxConex" style="height:40px;display:block;">
            </div>
            <div style="padding:24px;">
              <h2 style="margin-top:0;color:#071623;">Payment proof received</h2>
              <p style="color:#444;">Hi ${
                user.full_name || user.user_name || ""
              },</p>
              <p style="color:#444;line-height:1.6;">
                We’ve received your wire transfer payment details. Our payment team will
                verify the transfer within <strong>1–3 business days</strong> and process your order.
              </p>
              <p style="color:#444;line-height:1.6;">
                If you have any questions in the meantime, please reach out to
                <a href="mailto:admin@deluxconex.com">admin@deluxconex.com</a>.
              </p>
            </div>
          </div>
        </div>
      `;

      await sendEmail(
        user.email,
        "Wire transfer payment proof received",
        undefined,
        htmlUser
      );
    }

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; padding:16px;">
        <h2>Wire transfer payment submitted</h2>
        <p>
          A customer has submitted proof of payment for a wire transfer.<br/>
          Order ID: ${payload.orderId}<br/>
          Invoice ID: ${payload.invoiceId}<br/>
          User ID: ${payload.userId}<br/>
          ${proofUrl ? `Proof URL: <a href="${proofUrl}">${proofUrl}</a>` : ""}
        </p>
        <p>
          Please log into the admin dashboard to review the payment request and update the payment and invoice statuses.
        </p>
      </div>
    `;

    await sendEmail(
      "admin@deluxconex.com",
      "Wire transfer payment submitted",
      undefined,
      adminHtml
    );

    return sendResponse(
      res,
      200,
      "Payment proof submitted. Our payment team will verify within 1–3 business days."
    );
  } catch (error: any) {
    console.error("uploadWirePaymentProof error:", error);
    return sendResponse(
      res,
      500,
      "Failed to submit payment proof",
      null,
      error.message
    );
  }
};


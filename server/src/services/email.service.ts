import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use SMTP details from .env
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendBookingConfirmation = async (to: string, bookingDetails: any) => {
    const { userName, serviceName, date, salonName, price } = bookingDetails;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Booking Confirmation - GlamConnect',
        html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #ec4899;">Booking Confirmed!</h1>
        <p>Hi ${userName},</p>
        <p>Your appointment has been successfully scheduled.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Salon:</strong> ${salonName}</p>
          <p><strong>Date & Time:</strong> ${new Date(date).toLocaleString()}</p>
          <p><strong>Price:</strong> $${price}</p>
        </div>
        <p>We look forward to seeing you!</p>
        <p>The GlamConnect Team</p>
      </div>
    `,
    };

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Email credentials not found. Skipping email sending.');
            console.log('Would have sent email to:', to);
            return;
        }
        await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent to:', to);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, html, subject }:{
    to: string,
    subject: string,
    html: string
}) => {
    const transportOptions = {
        service : process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const main = async () => {
        const info = await transporter.sendMail({
            from: `"Social App" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html
        });
        console.log('Message sent: %s', info.messageId);
    }

    main().catch(console.error);
}

# Online SEO Portal

A full-stack digital marketing website and consultation platform for an SEO services business. The project combines a static marketing frontend with a Node.js backend that validates contact submissions, stores inquiry data in MongoDB, and can send email notifications through SMTP.

## Overview

Online SEO Portal is designed to present a modern SEO agency brand, showcase services, and capture leads through a consultation form. It includes:

- A responsive marketing frontend for service promotion and lead generation
- A backend API for contact submissions, service lookup, and health checks
- MongoDB-backed persistence for consultation inquiries
- SMTP email delivery for inbound marketing requests
- Security-focused response headers and CORS handling

## Tech Stack

- Frontend: HTML, CSS, and vanilla JavaScript
- Backend: Node.js with the native HTTP server
- Database: MongoDB
- Email: Nodemailer
- Environment management: dotenv
- Development workflow: Concurrently

## Project Structure

```text
.
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── test/
│   ├── server.js
│   └── ...
├── frontend/
│   ├── assets/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── ...
```

## Features

### Marketing site
- Landing page with hero banners and service highlight sections
- Business information and contact details
- SEO-focused content blocks and service categories
- Lead capture form for consultation requests

### Consultation API
- `POST /api/contact` for submitting inquiry data
- `GET /api/services` for service catalog information
- `GET /api/health` for backend and database health checks

### Data and email workflow
- Validates inquiry payload before saving
- Persists submissions in MongoDB
- Sends email notifications using SMTP to the configured recipient
- Preserves submissions even when email delivery fails, so leads are not lost

## Prerequisites

Before running the project locally, ensure you have:

- Node.js 22.13 or newer
- MongoDB running locally or in a remote deployment
- Access to an SMTP provider if you want outbound consultation emails enabled

## Local Setup

1. Clone the repository and navigate to the project root.
2. Create a local environment file from the template:

```powershell
Copy-Item .env.example .env
```

3. Update the environment values in `.env` for your local setup.
4. Install dependencies:

```bash
npm install
```

5. Start the application:

```bash
npm run dev
```

This starts both the backend and frontend concurrently.

### Accessing the app

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:3000`

You can also run each service separately:

```bash
npm run start:backend
npm run start:frontend
```

## Environment Variables

The project uses the following configuration values in `.env`:

```env
PORT=3000
HOST=127.0.0.1
FRONTEND_PORT=5173
FRONTEND_HOST=127.0.0.1
API_BASE_URL=http://127.0.0.1:3000
MONGODB_URI=mongodb://127.0.0.1:27017/online_seo_portal
CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
MAIL_TO=
```

### Notes

- Set `MONGODB_URI` to your MongoDB connection string.
- Keep `CORS_ORIGINS` aligned with the frontend origin used in your environment.
- For Gmail, use `smtp.gmail.com`, port `587`, `SMTP_SECURE=false`, and an app password.
- `MAIL_FROM` can be left empty to use the authenticated SMTP user.
- Do not commit `.env` or expose SMTP credentials in source control.

## API Reference

### Health check

```http
GET /api/health
```

Returns the current health status of the service and MongoDB connectivity.

### Service list

```http
GET /api/services
```

Returns the service catalog and consultation choices used by the frontend.

### Contact submission

```http
POST /api/contact
Content-Type: application/json
```

Request body example:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "service": "SEO Services",
  "message": "I would like to improve my website rankings and monthly traffic."
}
```

Accepted fields:

- `name`: required
- `email`: required
- `phone`: optional
- `service`: required
- `message`: required

The backend stores valid inquiries in MongoDB and attempts to deliver an email notification to `MAIL_TO`.

## MongoDB Schema

Database: `online_seo_portal` (or the database configured in `MONGODB_URI`)  
Collection: `inquiries`

```js
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  service: String,
  message: String,
  createdAt: Date
}
```

Validation rules are enforced before insertion, including checks for required fields, email format, and length constraints.

## Security

The backend applies security headers to responses and enforces CORS restrictions. Static assets are served through the backend layer, and the application expects environment-based configuration rather than hardcoded secrets.

## Development

Run the test suite with:

```bash
npm test
```

The project includes automated Node.js tests for server and email-related functionality.

## License

This project is distributed for internal business use and is not currently tied to a public license declaration.

## Support

For production deployment or advanced configuration changes, verify your MongoDB and SMTP settings before going live and keep environment variables managed securely in the deployment platform of your choice.

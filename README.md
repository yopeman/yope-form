# Yope Form 📝📊

> Turn any Google Sheet into a powerful public form and headless database in seconds.

**Yope Form** is a modern Next.js application that bridges the gap between spreadsheets and web forms. Connect your Google Spreadsheets to automatically generate schema-driven public forms, manage tabular records through a sleek dashboard, and collect live submissions directly into your Google Sheets without configuring complex databases.

---

## ✨ Features

- **Google Sheets as a Database:** Use Google Sheets as your primary storage for user accounts, linked sheets, tab schemas, and submitted records.
- **Dynamic Schema Builder:** Define and customize columns with data types:
  - `string` (Short text)
  - `number` (Numeric inputs with min/max bounds)
  - `text` (Multi-line text area)
  - `bool` (Boolean / Checkboxes)
  - `enum` (Dropdown selection with comma-separated options)
  - `uuid` (Auto-generated unique identifiers)
- **Instant Public Forms:** Automatically generate shareable, responsive public form links (`/f/[sheetId]/[tabId]`) with real-time submission handling and input validation.
- **Records Dashboard:** Interactive Table and Grid views to browse, search, create, update, and delete spreadsheet records directly from the web UI.
- **Multi-Tab Spreadsheets:** Manage multiple tabs/sheets within a single Google Spreadsheet.
- **User Authentication:** Secure JWT-based authentication with bcrypt-hashed passwords and encrypted session cookies.
- **Dark, Light & Night Themes:** Built-in theme switcher powered by `next-themes`.
- **Cutting-Edge Tech Stack:** Built with Next.js 16 (App Router, Turbopack, Partial Prerendering), React 19, and Tailwind CSS v4.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Frontend:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **State & Theming:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Backend / API:** Next.js Route Handlers
- **Google Sheets API:** [`google-spreadsheet`](https://theoephraim.github.io/node-google-spreadsheet) & [`google-auth-library`](https://github.com/googleapis/google-auth-library-nodejs)
- **Authentication:** [`jose`](https://github.com/panva/jose) (JWT) & [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js)

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js:** v20+ (v22 recommended)
- **npm**, **pnpm**, or **yarn**
- **Google Cloud Platform (GCP) Project** with:
  - Google Sheets API enabled
  - Google Drive API enabled
  - A Service Account and generated JSON key

---

### 2. Google Cloud Service Account Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services > Library** and enable:
   - **Google Sheets API**
   - **Google Drive API**
4. Navigate to **APIs & Services > Credentials** and click **Create Credentials > Service Account**.
5. Give the service account a name (e.g. `yope-form-service`) and click **Done**.
6. Click on the created service account, go to the **Keys** tab, click **Add Key > Create new key**, and choose **JSON**.
7. Download the key file. You will need the `client_email` and `private_key` from this JSON file.
8. Create a new Google Spreadsheet that will serve as the system database:
   - Name it (e.g., `Yope Form DB`).
   - Share this spreadsheet with the Service Account email (`client_email`) with **Editor** permissions.
   - Copy the Spreadsheet ID from the URL:
     `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

---

### 3. Clone & Install Dependencies

```bash
git clone https://github.com/yopeman/yope-form.git
cd yope-form
npm install
```

---

### 4. Environment Variables Configuration

Create a `.env` file in the root directory:

```env
# Google Service Account Credentials
CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"

# Master Google Spreadsheet ID (Used for internal user accounts and linked sheets)
SPREADSHEET_ID="your_master_google_spreadsheet_id"

# Session Security Secret
SESSION_SECRET="your-strong-random-session-secret-at-least-32-chars"
```

> **Note on `PRIVATE_KEY`:** Ensure private key newlines are represented as `\n` or appropriately enclosed in quotes.

---

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 How It Works

### 1. Register & Log In
Create an account. Yope Form automatically provisions a `user` tab inside your master Google Spreadsheet and stores your credentials securely.

### 2. Connect an External Google Sheet
1. Create any Google Spreadsheet you want to use for collecting form responses.
2. Share your spreadsheet with the service account email (displayed on your dashboard) as an **Editor**.
3. In Yope Form, click **"Add Sheet"** and paste your Google Sheet ID.

### 3. Configure Tabs and Schema
1. Open the connected sheet from your dashboard.
2. Create tabs and define field schemas (e.g., Name: `string`, Email: `string`, Age: `number`, Rating: `enum`).
3. Save the schema. The app will ensure the column headers match the defined schema.

### 4. Share Public Forms
1. Navigate to the tab and copy the **Public Form Link** (`/f/[sheetId]/[tabId]`).
2. Share the link with anyone! When users submit the form:
   - Their submission is validated against the defined schema.
   - A unique record ID is generated.
   - The row is appended directly to the Google Sheet tab in real-time.

---

## 🛠️ Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint checks |

---

## 📁 Project Structure

```text
yope-form/
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── api/            # Route Handlers
│   │   │   ├── auth/       # Authentication endpoints (login, register, logout, profile)
│   │   │   ├── public/     # Public form endpoints (fetch schema, submit form)
│   │   │   └── sheets/     # Spreadsheet & tab CRUD endpoints
│   │   ├── f/[id]/[tabId]/ # Public form page
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   ├── profile/        # User profile page
│   │   ├── sheets/[id]/    # Spreadsheet details & tab management
│   │   ├── layout.tsx      # Root layout with theme provider
│   │   └── page.tsx        # Landing page & dashboard
│   ├── components/         # Reusable UI components & Theme toggles
│   └── lib/                # Google Sheets helper & session utilities
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── package.json            # Dependencies and scripts
```

---

## 🔒 Security Best Practices

- Never commit your `.env` file or Google Cloud Service Account JSON key files to source control.
- Ensure `SESSION_SECRET` is set to a cryptographically secure random string in production.
- Only grant Editor access on specific Google Sheets intended for use with Yope Form.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

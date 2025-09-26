# 🚀 Outreachly - Email Campaign Management Platform

<div align="center">

![Outreachly Logo](https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=Outreachly)

**A modern, full-stack email marketing platform built with Next.js 15 and TypeScript**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![AWS SES](https://img.shields.io/badge/AWS-SES-FF9900?logo=amazon-aws)](https://aws.amazon.com/ses/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)](https://postgresql.org/)

[Live Demo](#) • [Documentation](#features) • [Getting Started](#getting-started) • [API Reference](#api-reference)

</div>

---

## ✨ Features

### 📧 **Campaign Management**
- 🎯 **Create & Send Campaigns** - Design email campaigns with template-based content
- 📊 **Real-time Analytics** - Track delivery rates, open rates, click rates, and bounces
- 🔄 **Status Tracking** - Monitor campaign progress from draft to completion
- 📝 **Custom Placeholders** - Advanced placeholder system with dot notation support
- 🎨 **Template Integration** - Seamless integration with reusable email templates

### 👥 **Contact Management**
- 📁 **Individual Contacts** - Full CRUD operations for contact management
- 📤 **CSV Bulk Import** - Upload up to 1,000 contacts at once with validation
- 🏷️ **Tagging System** - Organize contacts with custom tags
- 🗃️ **Archive System** - Soft delete functionality with data preservation
- ✅ **Data Validation** - Email format validation and duplicate prevention

### 📄 **Template System**
- 🎨 **Rich Template Editor** - Create professional email templates
- 🔧 **Dynamic Placeholders** - Support for `{{contact.firstName}}`, `{{campaign.name}}`, etc.
- 🧪 **Template Testing** - Send test emails to verify template rendering
- 📋 **Custom Placeholder Detection** - Automatically detect and manage custom variables
- 🔄 **Template Versioning** - Track template updates and modifications

### 📈 **Analytics & Reporting**
- 📊 **Campaign Statistics** - Comprehensive delivery and engagement metrics
- 📉 **Real-time Monitoring** - Live campaign progress tracking
- 🎯 **Recipient Insights** - Individual recipient status monitoring
- 📋 **Performance Reports** - Detailed analytics for data-driven decisions

---

## 🛠️ Technology Stack

### **Frontend**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React features and hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### **Backend & Database**
- **[Prisma ORM](https://prisma.io/)** - Type-safe database access
- **[PostgreSQL](https://postgresql.org/)** - Production database
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - RESTful API

### **Email Infrastructure**
- **[AWS SES](https://aws.amazon.com/ses/)** - Production-grade email delivery
- **[AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)** - Modern AWS integration

### **Testing & Quality**
- **[Jest](https://jestjs.io/)** - Unit and integration testing
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Component testing
- **[ESLint](https://eslint.org/)** - Code quality and consistency

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **PostgreSQL**
- **AWS Account** (for SES email delivery)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vijaybkhot/outreach-app.git
   cd outreachly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/outreachly"
   
   # AWS SES Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   
   # Email Configuration
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME="Your Company"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
outreachly/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── campaigns/        # Campaign management pages
│   │   ├── contacts/         # Contact management pages
│   │   ├── templates/        # Template management pages
│   │   └── layout.tsx        # Root layout
│   ├── components/           # Shared components
│   │   ├── Header.tsx        # Navigation header
│   │   └── Footer.tsx        # Site footer
│   ├── services/             # Business logic layer
│   │   ├── campaignService.ts
│   │   ├── contactService.ts
│   │   ├── templateService.ts
│   │   └── emailService.ts
│   ├── types/                # TypeScript type definitions
│   └── lib/                  # Utility functions
├── __tests__/                # Test files
└── public/                   # Static assets
```

---

## 🔧 API Reference

### **Campaigns**
```typescript
GET    /api/campaigns           # List all campaigns
POST   /api/campaigns           # Create new campaign
GET    /api/campaigns/[id]      # Get campaign details
PUT    /api/campaigns/[id]      # Update campaign
DELETE /api/campaigns/[id]      # Delete campaign
POST   /api/campaigns/[id]/send # Send campaign
```

### **Contacts**
```typescript
GET    /api/contacts            # List all contacts
POST   /api/contacts            # Create new contact
PUT    /api/contacts/[id]       # Update contact
DELETE /api/contacts/[id]       # Delete contact
POST   /api/contacts/import     # Bulk import contacts
```

### **Templates**
```typescript
GET    /api/templates           # List all templates
POST   /api/templates           # Create new template
PUT    /api/templates/[id]      # Update template
DELETE /api/templates/[id]      # Delete template
POST   /api/templates/[id]/test # Send test email
```

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- ✅ Service layer unit tests
- ✅ Component integration tests
- ✅ API endpoint testing
- ✅ Database operation testing

---

## 🎯 Key Features in Detail

### **Advanced Placeholder System**
```typescript
// Standard placeholders (auto-filled)
{{contact.firstName}}    // From contact database
{{contact.email}}        // From contact database
{{campaign.name}}        // From campaign data

// Custom placeholders (user-defined)
{{company.recent}}       // Manual entry required
{{skills.frontend}}      // Manual entry required
{{my.experience}}        // Manual entry required
```

### **Email Personalization**
- **Dynamic Content**: Replace placeholders with real data
- **Template Inheritance**: Reusable templates across campaigns
- **Custom Variables**: User-defined placeholders for flexibility
- **Real-time Preview**: See exactly how emails will look

### **Bulk Operations**
- **CSV Import**: Upload 1,000+ contacts with validation
- **Campaign Sending**: Send to multiple recipients simultaneously
- **Status Tracking**: Monitor individual email delivery status
- **Error Handling**: Graceful failure recovery and reporting

---

## 🚀 Deployment

### **Production Build**
```bash
npm run build
npm start
```

### **Database Migration**
```bash
npx prisma migrate deploy
```

### **Environment Setup**
Ensure all production environment variables are configured:
- Database connection string
- AWS SES credentials
- Email configuration

---

## 🤝 Contributing

We welcome contributions! Please see our Contributing Guide for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📊 Performance

- **Fast Loading**: Next.js App Router with optimized builds
- **Type Safety**: 100% TypeScript coverage
- **Database Optimization**: Efficient Prisma queries with proper indexing
- **Scalable Architecture**: Handles 1,000+ contacts and large campaigns
- **Error Resilience**: Comprehensive error handling and logging

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Prisma Team** - For the excellent ORM
- **AWS** - For reliable email infrastructure
- **Tailwind CSS** - For the utility-first CSS framework

---

## 📧 Support

For support, email [support@outreachly.com](mailto:support@outreachly.com) or join our [Discord community](https://discord.gg/outreachly).

---

<div align="center">

**Built with ❤️ by [Vijay Khot](https://github.com/vijaybkhot)**

[⭐ Star this repo](https://github.com/vijaybkhot/outreach-app) • [🐛 Report Bug](https://github.com/vijaybkhot/outreach-app/issues) • [💡 Request Feature](https://github.com/vijaybkhot/outreach-app/issues)

</div>

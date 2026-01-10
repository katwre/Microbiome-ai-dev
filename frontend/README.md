# Microbiome Analysis Frontend

React + TypeScript + Vite application for microbiome data analysis.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or bun

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

### Build for Production
```bash
npm run build
npm run preview  # Preview production build
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Watch mode (recommended during development)
npm test -- --watch

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage
```

📖 **See [TESTING.md](./TESTING.md) for comprehensive testing documentation**

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components (shadcn/ui)
│   ├── pages/          # Page components (routes)
│   │   ├── Index.tsx       # Upload form
│   │   ├── JobStatus.tsx   # Job status & results
│   │   └── NotFound.tsx    # 404 page
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and configuration
│   │   ├── api.ts          # API endpoints
│   │   ├── utils.ts        # UI utilities
│   │   └── validation.ts   # Form validation
│   ├── test/           # Test setup and mocks
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── TESTING.md          # Test documentation
└── package.json        # Dependencies & scripts
```

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com/) and Tailwind CSS:
- Modern, accessible components
- Dark mode support
- Fully customizable
- TypeScript support

## 🔧 Configuration

### Environment Variables

Create `.env.development` for local development:
```env
VITE_API_BASE_URL=http://localhost:8000
```

Create `.env.production` for production:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 📦 Key Dependencies

### Production
- **React 18** - UI library
- **React Router** - Routing
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Zod** - Schema validation

### Development
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **React Testing Library** - Component testing
- **MSW** - API mocking
- **ESLint** - Code linting

## 🚢 Deployment

### Docker (Development)
```bash
cd ../docker
docker-compose up -d
```

### Static Hosting (AWS S3)
```bash
npm run build
aws s3 sync dist/ s3://your-frontend-bucket
```

See [../DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) for complete deployment guide.

## 🎯 Features

### ✅ Implemented
- File upload (FASTQ)
- Test data option
- Real-time job status tracking
- Results visualization
- Bacteria composition display
- Download reports
- Responsive design
- Dark mode support
- Error handling
- Comprehensive test coverage

## 🐛 Troubleshooting

### Port already in use
```bash
lsof -ti:5173 | xargs kill -9
```

### Clear cache
```bash
rm -rf node_modules/.vite
npm run dev
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Testing Documentation](./TESTING.md)
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

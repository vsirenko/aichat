# ODAI Chat - AI Assistant

A modern AI chat application built with Next.js, featuring ODAI's multi-model reasoning pipeline.

## ✨ Features

- 🤖 **ODAI Integration** - Multi-model reasoning with 6-phase pipeline
- 📊 **Phase Tracking** - Real-time visualization of ODAI phases
- 🌐 **Web Search** - Integrated web search results
- 💰 **Cost Estimation** - Real-time cost tracking
- ⚡ **Lightning Fast** - Optimized Next.js 16 with Turbopack
- 🌓 **Dark Mode** - Beautiful light and dark themes
- 📱 **Responsive** - Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- ODAI access code (e.g., DEMO2025, INVESTOR-A, PARTNER-B, BETA-TEST, ADMIN-KEY)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables (optional for development)
cat > .env.local << EOF
ODAI_API_BASE_URL=http://45.63.92.192:52847
# Optional: Pre-configured access token for server-side operations
# ODAI_ACCESS_TOKEN=your-access-token
EOF

# 3. Run development server
pnpm dev

# 4. Open http://localhost:3000
# 5. Enter your access code when prompted (e.g., DEMO2025)
```

## 📦 Build & Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Or deploy to Vercel
vercel --prod
```

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **AI**: Vercel AI SDK with custom ODAI provider
- **UI**: React 19, Tailwind CSS v4, Radix UI
- **Fonts**: Lexend Deca & Lexend Zetta
- **Styling**: ODAI brand colors, responsive design

## 📚 Documentation

- **`ODAI_INTEGRATION.md`** - ODAI API integration guide
- **`public/logos/README.md`** - Logo asset instructions

## 🎯 ODAI Features

### 6-Phase Pipeline

1. **Safety Classification** - Content safety check
2. **Pre-Analysis** - Query complexity analysis
3. **Budget Allocation** - Resource allocation
4. **Prompt Engineering** - Prompt optimization
5. **Parallel Inference** - Multi-model execution
6. **Response Selection** - Best response selection

### Options

- Include phase events
- Skip safety check
- Skip LLM enhancement
- Skip LLM judge
- Max samples per model (1-10)

### Models

- **ODAI Frontier** - Full multi-model reasoning pipeline
- **ODAI Fast** - Optimized for speed (coming soon)

## 🔧 Configuration

### Authentication

The app uses a simplified access code authentication flow:

1. **User enters access code** (e.g., DEMO2025)
2. **Receives session token** (valid for 60 minutes, 50 requests)
3. **Token used for all API calls**
4. **Session stored in sessionStorage**

Valid access codes for testing:

- `DEMO2025`
- `INVESTOR-A`
- `PARTNER-B`
- `BETA-TEST`
- `ADMIN-KEY`

### Environment Variables

```bash
# Required: ODAI API Base URL
ODAI_API_BASE_URL=http://45.63.92.192:52847

# Optional: Pre-configured access token (bypasses UI authentication)
# Useful for server-side operations or development
ODAI_ACCESS_TOKEN=your-session-token

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
```

### Authentication Flow

```
User Input → POST /api/auth/access → Session Token
                                    ↓
                            Store in sessionStorage
                                    ↓
                    Use in Authorization header for all requests
                                    ↓
                        401 Error → Prompt for new access code
```

### Customization

- **Colors**: Edit `app/globals.css` (CSS variables)
- **Fonts**: Update `app/layout.tsx`
- **Logo**: Replace placeholder in `components/icons.tsx`
- **Metadata**: Update `app/layout.tsx`

## 🎨 ODAI Color Palette

```
Light Mode:
  Primary:   #3B43FE (Blue)
  Secondary: #D6FFA6 (Green Light)
  Accent:    #E5FACD (Green Lighter)
  Text:      #111111 (Black)
  BG:        #FFFFFF (White)

Dark Mode:
  Primary:   #989CF9 (Blue Light)
  Secondary: #74885C (Green Dark)
  BG:        #111111 (Black)
  Text:      #FFFFFF (White)
```

## 🧪 Testing

```bash
# Run Playwright tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:

- Next.js by Vercel
- AI SDK by Vercel
- Tailwind CSS
- Radix UI
- Lexend Fonts by Google Fonts

---

**ODAI Chat** - Intelligent AI Assistant with Multi-Model Reasoning

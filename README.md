# YouTube App

A modern YouTube application built with Next.js 13 (App Router), TypeScript, Tailwind CSS, and ESLint.

## Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with theme configuration
- **Linting**: ESLint 9
- **Font**: Geist Sans and Geist Mono from Vercel
- **Runtime Config**: Environment validation with `env.mjs`

## Project Structure

```
├── app/                 # Next.js App Router (pages, layouts)
├── components/          # Reusable React components
├── stores/              # State management (Zustand, Redux, etc.)
├── lib/                 # Utility functions and helpers
├── types/               # TypeScript type definitions
├── public/              # Static assets
├── env.mjs              # Environment configuration and validation
├── tailwind.config.ts   # Tailwind CSS theme configuration
├── tsconfig.json        # TypeScript configuration
└── next.config.ts       # Next.js configuration
```

## Features

✓ **Type-Safe Development**: Full TypeScript support for enhanced developer experience  
✓ **Fast Performance**: Built on the modern App Router  
✓ **Styled with Tailwind CSS**: Utility-first CSS with comprehensive theming  
✓ **Code Quality**: ESLint integration for consistent code standards  
✓ **Light/Dark Mode**: CSS variables and media query-based theming  
✓ **Environment Validation**: Fast-fail validation for required environment variables  

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment configuration**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```

4. **Set environment variables**
   Edit `.env.local` and add your YouTube API key:
   ```env
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

   To get a YouTube API key:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the YouTube Data API v3
   - Create an API key credential
   - Copy the key to your `.env.local` file

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- **`npm run dev`** - Start the development server on port 3000
- **`npm run build`** - Create an optimized production build
- **`npm run start`** - Start the production server
- **`npm run lint`** - Run ESLint to check code quality

## Configuration

### Tailwind CSS Theme

The Tailwind configuration extends the default theme with custom colors, fonts, and spacing scales. See `tailwind.config.ts` for details.

**Color Palette:**
- Primary: Blue (50-900)
- Neutral: Gray (50-900)
- Semantic: Success, Warning, Error

### CSS Variables & Theming

Global CSS variables are defined in `app/globals.css`:

**Light Mode:**
```css
--color-background: #ffffff
--color-foreground: #171717
--color-surface: #f9fafb
```

**Dark Mode:**
```css
--color-background: #0a0a0a
--color-foreground: #ededed
--color-surface: #1f2937
```

Auto-switching is handled via `prefers-color-scheme` media query.

### Environment Variables

Required environment variables are validated in `env.mjs`. The validation runs at build time and warns in development mode.

**Required Variables:**
- `NEXT_PUBLIC_YOUTUBE_API_KEY` - YouTube Data API key

## Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Import the project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the Next.js configuration

3. **Set environment variables**
   In your Vercel project settings:
   - Go to "Settings" → "Environment Variables"
   - Add `NEXT_PUBLIC_YOUTUBE_API_KEY` with your YouTube API key
   - Redeploy your project

4. **Deploy**
   - Vercel will automatically deploy when you push to your main branch
   - Or manually trigger a deployment in the Vercel dashboard

### Other Platforms

The application can be deployed to any platform that supports Node.js 18+:

- **Netlify**: Build command: `npm run build`, Publish directory: `.next`
- **AWS Amplify**: Connect your GitHub repo and follow the wizard
- **Docker**: Use the Node.js image and run `npm run build && npm run start`

## API Integration

### YouTube API

The application is configured to use the YouTube Data API v3. The API key is stored in environment variables and validated at startup.

To use the API:
1. Ensure `NEXT_PUBLIC_YOUTUBE_API_KEY` is set in your environment
2. Create API calls in your components or server actions
3. The environment validation will fail fast if the key is missing in production

## Development Workflow

### Code Quality

- **ESLint**: Run `npm run lint` to check code quality
- **TypeScript**: Strict mode enabled for type safety
- **Formatting**: Configure your IDE to auto-format on save

### Best Practices

1. **Components**: Keep components in `/components` and use TypeScript interfaces
2. **Utilities**: Place helper functions in `/lib` with proper typing
3. **Types**: Define shared types in `/types` directory
4. **State**: Consider Zustand or Redux for complex state management in `/stores`

## Troubleshooting

### Environment validation fails
- Ensure `.env.local` exists and contains `NEXT_PUBLIC_YOUTUBE_API_KEY`
- Check that the API key is valid and enabled in Google Cloud Console

### Tailwind styles not applied
- Verify `tailwind.config.ts` content patterns include your file extensions
- Clear `.next` directory and rebuild: `rm -rf .next && npm run build`

### TypeScript errors
- Run `npm run build` to see full type errors
- Check `tsconfig.json` is correctly configured
- Ensure all imported modules have proper type definitions

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue in the repository or contact the development team.

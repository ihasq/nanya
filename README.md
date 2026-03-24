# Nanya

A modern, LLM-powered translation app with style adjustments and translation history.

## Features

- **Auto Language Detection** - Automatically detects source language and translates:
  - Japanese → English
  - Other languages → Japanese
- **Multiple LLM Models** - Choose from various models via OpenRouter (Gemini, GPT-4o Mini, etc.)
- **Style Adjustments** - Fine-tune translations with different tones:
  - Casual / Polite / Neutral
  - Concise / Detailed
  - Natural / Less AI-like
- **Translation History** - Save and revisit past translations (stored locally)
- **OAuth Authentication** - Secure PKCE-based authentication with OpenRouter

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Radix UI + shadcn/ui
- Zustand (state management)
- OpenRouter API

## Getting Started

### Prerequisites

- Node.js 20+
- An [OpenRouter](https://openrouter.ai/) account

### Installation

```bash
git clone https://github.com/ihasq/nanya.git
cd nanya
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

## Usage

1. Click **Sign in with OpenRouter** to authenticate
2. Enter text to translate
3. Press **Translate** or use `Ctrl+Enter`
4. Optionally adjust the translation style using quick actions

## Project Structure

```
src/
├── components/     # React components
│   ├── ui/         # shadcn/ui components
│   └── ...         # App-specific components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and API clients
├── stores/         # Zustand stores
└── main.tsx        # Entry point
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

- [OpenRouter](https://openrouter.ai/) for LLM API access
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives

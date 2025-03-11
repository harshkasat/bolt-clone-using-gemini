export const basePrompt = `<boltArtifact id=\"project-import\" title=\"Project Files\"><boltAction type=\"file\" filePath=\"eslint.config.js\">import js from '@eslint/js';
import globals from 'globals';
import next from 'eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.next', 'out', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, 'plugin:next/recommended'],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      next,
    },
    rules: {
      'next/no-html-link-for-pages': 'off',
    },
  }
);
</boltAction><boltAction type=\"file\" filePath=\"package.json\">{
  "name": "nextjs-starter",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "^9.9.1",
    "eslint-plugin-next": "latest",
    "globals": "^15.9.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3"
  }
}
</boltAction><boltAction type=\"file\" filePath=\"postcss.config.js\">export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
</boltAction><boltAction type=\"file\" filePath=\"tailwind.config.js\">/** @type {import('tailwindcss').Config} */
export default {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
</boltAction><boltAction type=\"file\" filePath=\"tsconfig.json\">{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "moduleResolution": "node",
    "allowJs": true,
    "isolatedModules": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
</boltAction><boltAction type=\"file\" filePath=\"pages/index.tsx\">import Head from 'next/head';

export default function Home() {
  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gray-100\">
      <Head>
        <title>Next.js + Tailwind Starter</title>
      </Head>
      <p>Start editing to see magic happen :)</p>
    </div>
  );
}
</boltAction><boltAction type=\"file\" filePath=\"styles/globals.css\">@tailwind base;
@tailwind components;
@tailwind utilities;
</boltAction><boltAction type=\"file\" filePath=\"next-env.d.ts\">/// <reference types=\"next\" />
/// <reference types=\"next/image-types/global\" />
/// <reference types=\"next/navigation-types/global\" />
</boltAction></boltArtifact>`

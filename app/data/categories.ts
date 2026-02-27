export const categories = [
  {
    id: "json",
    icon: "📋",
    name: "Data & JSON",
    color: "green",
    tools: [
      {
        name: "JSON Formatter",
        desc: "Pretty print & validate JSON instantly",
        href: "/tools/json-formatter",
      },
      {
        name: "JSON → YAML",
        desc: "Convert JSON to YAML format",
        href: "/tools/json-to-yaml",
      },
      {
        name: "JSON → CSV",
        desc: "Export JSON arrays to CSV spreadsheet",
        href: "/tools/json-to-csv",
      },
      {
        name: "JSON Diff",
        desc: "Compare two JSON objects side by side",
        href: "/tools/json-diff",
      },
      {
        name: "JSON Minifier",
        desc: "Remove whitespace and minify JSON",
        href: "/tools/json-minifier",
      },
      {
        name: "CSV → JSON",
        desc: "Parse CSV files into JSON arrays",
        href: "/tools/csv-to-json",
      },
      {
        name: "XML Formatter",
        desc: "Beautify and validate XML documents",
        href: "/tools/xml-formatter",
      },
      {
        name: "XML → JSON",
        desc: "Transform XML structure to JSON",
        href: "/tools/xml-to-json",
      },
      {
        name: "JSON Schema Generator",
        desc: "Auto-generate JSON Schema from any JSON",
        href: "/tools/json-schema-generator",
      },
      {
        name: "JSON → TypeScript",
        desc: "Generate TypeScript interfaces from JSON",
        href: "/tools/json-to-typescript",
      },
      {
        name: "SQL Formatter",
        desc: "Beautify and format SQL queries",
        href: "/tools/sql-formatter",
      },
    ],
  },
  {
    id: "security",
    icon: "🔐",
    name: "Encoding & Security",
    color: "orange",
    tools: [
      {
        name: "Base64 Encode/Decode",
        desc: "Encode text or files to Base64",
        href: "/tools/base64",
      },
      {
        name: "URL Encode/Decode",
        desc: "Encode special chars for URLs",
        href: "/tools/url-encode",
      },
      {
        name: "JWT Decoder",
        desc: "Inspect JWT token payload & header",
        href: "/tools/jwt-decoder",
      },
      {
        name: "Hash Generator",
        desc: "Generate MD5, SHA256, SHA512 hashes",
        href: "/tools/hash-generator",
      },
      {
        name: "UUID Generator",
        desc: "Generate UUIDs v4 and v7 in bulk",
        href: "/tools/uuid-generator",
      },
      {
        name: "Password Generator",
        desc: "Strong random password with rules",
        href: "/tools/password-generator",
      },
      {
        name: "bcrypt Hash",
        desc: "Hash and verify bcrypt passwords",
        href: "/tools/bcrypt",
      },
      {
        name: "HMAC Generator",
        desc: "Generate HMAC signatures",
        href: "/tools/hmac-generator",
      },
      {
        name: "Random Token",
        desc: "Generate secure random tokens",
        href: "/tools/random-token",
      },
      {
        name: "HTML Entities",
        desc: "Encode & decode HTML special characters",
        href: "/tools/html-entities",
      },
      {
        name: "String Escape",
        desc: "Escape or unescape \\n, \\t, quotes and more",
        href: "/tools/string-escape",
      },
    ],
  },
  {
    id: "time",
    icon: "🕒",
    name: "Date & Time",
    color: "purple",
    tools: [
      {
        name: "Timestamp Converter",
        desc: "Unix timestamp to human date & back",
        href: "/tools/timestamp-converter",
      },
      {
        name: "Timezone Converter",
        desc: "Convert time between any timezones",
        href: "/tools/timezone-converter",
      },
      {
        name: "Cron Generator",
        desc: "Build and explain cron expressions",
        href: "/tools/cron-generator",
      },
      {
        name: "Age Calculator",
        desc: "Calculate age from date of birth",
        href: "/tools/age-calculator",
      },
      {
        name: "Unix Live Clock",
        desc: "Live Unix timestamp ticker",
        href: "/tools/unix-clock",
      },
      {
        name: "Date Formatter",
        desc: "Format dates in any pattern",
        href: "/tools/date-formatter",
      },
    ],
  },
  {
    id: "dev",
    icon: "📦",
    name: "Developer Utilities",
    color: "cyan",
    tools: [
      {
        name: "Regex Tester",
        desc: "Test and debug regular expressions",
        href: "/tools/regex-tester",
      },
      {
        name: "Markdown Preview",
        desc: "Live Markdown to HTML renderer",
        href: "/tools/markdown-preview",
      },
      {
        name: "Code Diff",
        desc: "Compare two code snippets inline",
        href: "/tools/code-diff",
      },
      {
        name: "Case Converter",
        desc: "camelCase, snake_case, PascalCase, etc.",
        href: "/tools/case-converter",
      },
      {
        name: "Slug Generator",
        desc: "Convert text to URL-friendly slug",
        href: "/tools/slug-generator",
      },
      {
        name: "Lorem Ipsum",
        desc: "Generate placeholder text",
        href: "/tools/lorem-ipsum",
      },
      {
        name: "HTML Preview",
        desc: "Live preview HTML in browser",
        href: "/tools/html-preview",
      },
      {
        name: "Curl → Fetch",
        desc: "Convert curl commands to JS fetch code",
        href: "/tools/curl-to-fetch",
      },
      {
        name: "Gitignore Generator",
        desc: "Generate .gitignore for any project type",
        href: "/tools/gitignore-generator",
      },
      {
        name: "Chmod Calculator",
        desc: "Visually calculate Unix file permissions",
        href: "/tools/chmod-calculator",
      },
      {
        name: "Markdown Table",
        desc: "Build tables visually, copy as Markdown",
        href: "/tools/markdown-table",
      },
      {
        name: "HTTP Status Codes",
        desc: "Searchable reference for all HTTP codes",
        href: "/tools/http-status-codes",
      },
      {
        name: "API Request Builder",
        desc: "Build requests, get fetch/axios/curl code",
        href: "/tools/api-request-builder",
      },
      {
        name: "Code Screenshot",
        desc: "Turn code into a beautiful shareable image",
        href: "/tools/code-screenshot",
      },
      {
        name: ".env Parser",
        desc: "Parse and validate .env files instantly",
        href: "/tools/env-parser",
      },
      {
        name: "OG Image Previewer",
        desc: "Preview Open Graph social share image",
        href: "/tools/og-previewer",
      },
    ],
  },
  {
    id: "text",
    icon: "📝",
    name: "Text Tools",
    color: "pink",
    tools: [
      {
        name: "Word Counter",
        desc: "Count words, chars, sentences & paragraphs",
        href: "/tools/word-counter",
      },
      {
        name: "Character Counter",
        desc: "Count chars with Twitter/LinkedIn limits",
        href: "/tools/character-counter",
      },
      {
        name: "Text Diff",
        desc: "Compare two blocks of text line by line",
        href: "/tools/text-diff",
      },
      {
        name: "Word Frequency",
        desc: "Count how often each word appears in text",
        href: "/tools/word-frequency",
      },
      {
        name: "Duplicate Line Remover",
        desc: "Remove duplicate lines from any text",
        href: "/tools/duplicate-remover",
      },
      {
        name: "Text Sorter",
        desc: "Sort lines alphabetically or by length",
        href: "/tools/text-sorter",
      },
      {
        name: "Text to ASCII Art",
        desc: "Convert text into ASCII art banners",
        href: "/tools/ascii-art",
      },
    ],
  },
  {
    id: "css",
    icon: "🎨",
    name: "CSS Tools",
    color: "violet",
    tools: [
      {
        name: "Box Shadow Generator",
        desc: "Build box-shadow visually with live preview",
        href: "/tools/box-shadow",
      },
      {
        name: "Gradient Generator",
        desc: "Create linear & radial gradients visually",
        href: "/tools/gradient-generator",
      },
      {
        name: "CSS Units Converter",
        desc: "Convert px ↔ rem ↔ em ↔ vh ↔ vw",
        href: "/tools/css-units",
      },
      {
        name: "Tailwind Color Finder",
        desc: "Find the closest Tailwind class for any HEX",
        href: "/tools/tailwind-color",
      },
      {
        name: "Tailwind Generator",
        desc: "Pick CSS properties, get Tailwind classes",
        href: "/tools/tailwind-generator",
      },
    ],
  },
  {
    id: "image",
    icon: "🖼️",
    name: "Image Tools",
    color: "yellow",
    tools: [
      {
        name: "Image Compressor",
        desc: "Compress PNG/JPG without quality loss",
        href: "/tools/image-compressor",
      },
      {
        name: "Image → Base64",
        desc: "Convert image files to Base64 string",
        href: "/tools/image-to-base64",
      },
      {
        name: "Base64 → Image",
        desc: "Decode Base64 back to image",
        href: "/tools/base64-to-image",
      },
      {
        name: "Color Picker",
        desc: "Pick colors and get HEX, RGB, HSL",
        href: "/tools/color-picker",
      },
      {
        name: "HEX ↔ RGB",
        desc: "Convert between HEX and RGB colors",
        href: "/tools/hex-rgb",
      },
      {
        name: "Image Resizer",
        desc: "Resize images to exact dimensions",
        href: "/tools/image-resizer",
      },
      {
        name: "Color Palette",
        desc: "Generate a full palette from one color",
        href: "/tools/color-palette",
      },
    ],
  },
  {
    id: "network",
    icon: "🌐",
    name: "Web & Network",
    color: "teal",
    tools: [
      {
        name: "IP Info",
        desc: "See your current IP, location & ISP",
        href: "/tools/ip-info",
      },
      {
        name: "URL Parser",
        desc: "Break down URL into protocol, host, params",
        href: "/tools/url-parser",
      },
      {
        name: "User Agent Parser",
        desc: "Detect browser, OS and device from UA string",
        href: "/tools/user-agent-parser",
      },
      {
        name: "DNS Lookup",
        desc: "Query DNS records for any domain",
        href: "/tools/dns-lookup",
      },
    ],
  },
  {
    id: "math",
    icon: "🔢",
    name: "Math & Conversion",
    color: "red",
    tools: [
      {
        name: "Number Base Converter",
        desc: "Convert binary, hex, decimal, octal",
        href: "/tools/number-base",
      },
      {
        name: "ASCII ↔ Text",
        desc: "Convert text to ASCII codes and back",
        href: "/tools/ascii-text",
      },
      {
        name: "Unit Converter",
        desc: "Length, weight, temperature, speed & more",
        href: "/tools/unit-converter",
      },
      {
        name: "Percentage Calculator",
        desc: "Quick percentage and ratio calculations",
        href: "/tools/percentage-calculator",
      },
      {
        name: "Roman Numerals",
        desc: "Convert between Roman numerals and numbers",
        href: "/tools/roman-numerals",
      },
    ],
  },
];

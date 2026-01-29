const globals = require("globals");
const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        files: ["src/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest
            },
            ecmaVersion: 2021,
            sourceType: "commonjs"
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "no-undef": "error"
        }
    },
    {
        files: ["src/tests/**/*.js", "**/*.test.js"],
        languageOptions: {
            sourceType: "module"
        }
    },
    {
        ignores: ["node_modules/**"]
    }
];

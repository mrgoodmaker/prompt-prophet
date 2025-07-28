"use strict";
(() => {
var exports = {};
exports.id = 250;
exports.ids = [250];
exports.modules = {

/***/ 961:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ handler)
/* harmony export */ });
// pages/api/prompt.js
async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Only POST requests allowed"
        });
    }
    const { refinedIntent } = req.body;
    if (!refinedIntent) {
        return res.status(400).json({
            error: "Missing refined intent"
        });
    }
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are Prompt Prophet, a master of prompt architecture. Your job is to take a refined user intention and return a powerful, precise, emotionally intelligent prompt they can copy/paste into an LLM. This is NOT a result or answer — only a crafted prompt to guide AI. Use symbolic clarity, directive framing, and include useful role/context if helpful.`
                    },
                    {
                        role: "user",
                        content: refinedIntent
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });
        const data = await response.json();
        const prompt = data.choices?.[0]?.message?.content || "No prompt generated.";
        return res.status(200).json({
            prompt
        });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(961));
module.exports = __webpack_exports__;

})();
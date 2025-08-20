"use strict";
(() => {
var exports = {};
exports.id = 142;
exports.ids = [142];
exports.modules = {

/***/ 945:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ handler)
/* harmony export */ });
async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Only POST requests allowed"
        });
    }
    const { intent } = req.body;
    if (!intent) {
        return res.status(400).json({
            error: "Missing intent"
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
                        content: `You are Prompt Prophet. Your job is to take a user's raw desire or goal and reflect it back to them in symbolic, emotionally resonant, and mythic language. Do not solve it or give advice. Just reflect their deeper intent.`
                    },
                    {
                        role: "user",
                        content: intent
                    }
                ],
                temperature: 0.85,
                max_tokens: 200
            })
        });
        const data = await response.json();
        const refinedIntent = data.choices?.[0]?.message?.content || "No response generated.";
        return res.status(200).json({
            refinedIntent
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
var __webpack_exports__ = (__webpack_exec__(945));
module.exports = __webpack_exports__;

})();
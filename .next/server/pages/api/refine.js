"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/api/refine";
exports.ids = ["pages/api/refine"];
exports.modules = {

/***/ "(api)/./pages/api/refine.js":
/*!*****************************!*\
  !*** ./pages/api/refine.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ handler)\n/* harmony export */ });\nasync function handler(req, res) {\n    if (req.method !== \"POST\") {\n        return res.status(405).json({\n            error: \"Method not allowed\"\n        });\n    }\n    const { name, email, intent } = req.body;\n    console.log(\"\\uD83D\\uDCE5 Incoming request to /api/refine\");\n    console.log(\"User intent:\", intent);\n    try {\n        // Return a fake Layer 3 result\n        const refinedIntent = `Let’s upgrade this intent: \"${intent}\" into a power move.`;\n        console.log(\"✅ Refined Intent Output:\", refinedIntent);\n        return res.status(200).json({\n            refinedIntent\n        });\n    } catch (error) {\n        console.error(\"❌ Refine error:\", error);\n        return res.status(500).json({\n            error: \"Refinement failed\"\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaSkvLi9wYWdlcy9hcGkvcmVmaW5lLmpzIiwibWFwcGluZ3MiOiI7Ozs7QUFBZSxlQUFlQSxRQUFRQyxHQUFHLEVBQUVDLEdBQUc7SUFDNUMsSUFBSUQsSUFBSUUsTUFBTSxLQUFLLFFBQVE7UUFDekIsT0FBT0QsSUFBSUUsTUFBTSxDQUFDLEtBQUtDLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQXFCO0lBQzVEO0lBRUEsTUFBTSxFQUFFQyxJQUFJLEVBQUVDLEtBQUssRUFBRUMsTUFBTSxFQUFFLEdBQUdSLElBQUlTLElBQUk7SUFFeENDLFFBQVFDLEdBQUcsQ0FBQztJQUNaRCxRQUFRQyxHQUFHLENBQUMsZ0JBQWdCSDtJQUU1QixJQUFJO1FBQ0YsK0JBQStCO1FBQy9CLE1BQU1JLGdCQUFnQixDQUFDLDRCQUE0QixFQUFFSixPQUFPLG9CQUFvQixDQUFDO1FBRWpGRSxRQUFRQyxHQUFHLENBQUMsNEJBQTRCQztRQUV4QyxPQUFPWCxJQUFJRSxNQUFNLENBQUMsS0FBS0MsSUFBSSxDQUFDO1lBQUVRO1FBQWM7SUFDOUMsRUFBRSxPQUFPUCxPQUFPO1FBQ2RLLFFBQVFMLEtBQUssQ0FBQyxtQkFBbUJBO1FBQ2pDLE9BQU9KLElBQUlFLE1BQU0sQ0FBQyxLQUFLQyxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFvQjtJQUMzRDtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcHJvbXB0LXByb3BoZXQvLi9wYWdlcy9hcGkvcmVmaW5lLmpzP2EwNzEiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xuICB9XG5cbiAgY29uc3QgeyBuYW1lLCBlbWFpbCwgaW50ZW50IH0gPSByZXEuYm9keTtcblxuICBjb25zb2xlLmxvZygn8J+TpSBJbmNvbWluZyByZXF1ZXN0IHRvIC9hcGkvcmVmaW5lJyk7XG4gIGNvbnNvbGUubG9nKCdVc2VyIGludGVudDonLCBpbnRlbnQpO1xuXG4gIHRyeSB7XG4gICAgLy8gUmV0dXJuIGEgZmFrZSBMYXllciAzIHJlc3VsdFxuICAgIGNvbnN0IHJlZmluZWRJbnRlbnQgPSBgTGV04oCZcyB1cGdyYWRlIHRoaXMgaW50ZW50OiBcIiR7aW50ZW50fVwiIGludG8gYSBwb3dlciBtb3ZlLmA7XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIFJlZmluZWQgSW50ZW50IE91dHB1dDonLCByZWZpbmVkSW50ZW50KTtcblxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHJlZmluZWRJbnRlbnQgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIFJlZmluZSBlcnJvcjonLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdSZWZpbmVtZW50IGZhaWxlZCcgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJoYW5kbGVyIiwicmVxIiwicmVzIiwibWV0aG9kIiwic3RhdHVzIiwianNvbiIsImVycm9yIiwibmFtZSIsImVtYWlsIiwiaW50ZW50IiwiYm9keSIsImNvbnNvbGUiLCJsb2ciLCJyZWZpbmVkSW50ZW50Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(api)/./pages/api/refine.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(api)/./pages/api/refine.js"));
module.exports = __webpack_exports__;

})();
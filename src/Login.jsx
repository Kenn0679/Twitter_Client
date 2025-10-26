import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
	const [params] = useSearchParams();
	const navigate = useNavigate();
	const hasShownToast = useRef(false);

	useEffect(() => {
		const access_token = params.get("access_token");
		const refresh_token = params.get("refresh_token");
		const new_user = params.get("new_user");

		localStorage.setItem("access_token", access_token || "");
		localStorage.setItem("refresh_token", refresh_token || "");

		// Show toast notification based on new_user status (only once)
		if (!hasShownToast.current && new_user) {
			hasShownToast.current = true;

			if (new_user === "true") {
				toast.success("Welcome! Your account has been created successfully!", {
					duration: 2000,
					position: "top-right",
				});
			} else if (new_user === "false") {
				toast.success("Welcome back! You have logged in successfully!", {
					duration: 2000,
					position: "top-right",
				});
			}
		}

		setTimeout(() => {
			navigate("/");
		}, 3000);
	}, [params, navigate]);

	return (
		<div>
			<h1>Login Page</h1>
			<Toaster />
		</div>
	);
}

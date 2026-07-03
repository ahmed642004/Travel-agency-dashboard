import { Link, redirect } from "react-router";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { loginWithGoogleSupa } from "~/supabase/supabase";
import supabase from "~/supabase/supabase";
import { useState } from "react";

export async function clientLoader() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (user?.id) return redirect("/");
  } catch (e) {
    console.log("Error fetching user", e);
  }
}

const SignIn = () => {
  return (
    <main className="auth">
      <section className="size-full glassmorphism flex-center px-6">
        <div className="sign-in-card">
          <header className="header">
            <Link to="/">
              <img
                src="/assets/icons/logo.svg"
                alt="logo"
                className="size-[30px]"
              />
            </Link>
            <h1 className="p-28-bold text-dark-100">Tourvisto</h1>
          </header>

          <article>
            <h2 className="p-28-semibold text-dark-100 text-center">
              Start Your Travel Journey
            </h2>

            <p className="p-18-regular text-center text-gray-100 !leading-7">
              Sign in with Google to manage destinations, itineraries, and user
              activity with ease.
            </p>
          </article>

          <div className="flex flex-col gap-3">
            <ButtonComponent
              type="button"
              iconCss="e-search-icon"
              className="button-class !h-11 !w-full"
              onClick={() => loginWithGoogleSupa("user")}
            >
              <img
                src="/assets/icons/google.svg"
                className="size-5"
                alt="google"
              />
              <span className="p-18-semibold text-white">Sign in as User</span>
            </ButtonComponent>

            <ButtonComponent
              type="button"
              iconCss="e-search-icon"
              className="button-class !h-11 !w-full !bg-dark-400 hover:!bg-dark-300"
              onClick={() => loginWithGoogleSupa("admin")}
            >
              <img
                src="/assets/icons/google.svg"
                className="size-5"
                alt="google"
              />
              <span className="p-18-semibold text-white">Sign in as Admin</span>
            </ButtonComponent>
          </div>
        </div>
      </section>
    </main>
  );
};
export default SignIn;

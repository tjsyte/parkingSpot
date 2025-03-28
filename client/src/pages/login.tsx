import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, loginWithEmail, registerWithEmail } from "@/services/firebase"; // Removed createUserInBackend
import { useAuth } from "@/contexts/AuthContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional()
});

const registerSchema = z.object({
  email: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleEmailLogin = async (data: LoginFormValues) => {
    try {
      const userCredential = await loginWithEmail(data.email, data.password);
      setUser(userCredential.user);
      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "default"
      });
      navigate("/map");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEmailRegister = async (data: RegisterFormValues) => {
    try {
      console.log("Attempting to register with email:", data.email);

      // Pass correct arguments to registerWithEmail
      const userCredential = await registerWithEmail(data.email, data.password);
      const { uid, email } = userCredential.user;

      setUser(userCredential.user);
      navigate("/map");
    } catch (error: any) {
      console.error("Registration Error:", error);
      const errorMessage =
        error.message === "Invalid email format. Please provide a valid email address."
          ? "The email address you entered is invalid. Please try again."
          : error.message || "An unexpected error occurred. Please try again.";
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithGoogle();
      setUser(userCredential.user);
      toast({
        title: "Login successful",
        description: "Welcome to EzPark Connect!",
        variant: "default"
      });
      navigate("/map");
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      const errorMessage =
        error.code === "auth/popup-closed-by-user"
          ? "Google sign-in was canceled. Please try again."
          : error.message || "An unexpected error occurred.";
      toast({
        title: "Google login failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center px-4 py-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <img 
              src="/assets/ezpark-logo.png" 
              alt="EzPark Connect Logo" 
              className="h-24 mx-auto mb-2"
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              EzPark Connect
            </h1>
            <p className="text-gray-600">Find available parking spots near you</p>
          </div>

          {isLogin ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-5">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={loginForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="remember-me"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium" htmlFor="remember-me">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <a href="#" className="text-sm font-medium text-primary hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>

                <Button type="submit" className="w-full">
                  Sign in
                </Button>

                <div className="mt-6 relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Sign in with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleLogin}
                  >
                    <i className="fab fa-google text-[#4285F4] mr-2"></i>
                    Google
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleEmailRegister)} className="space-y-5">
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Sign up
                </Button>

                <div className="mt-6 relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Sign up with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleLogin}
                  >
                    <i className="fab fa-google text-[#4285F4] mr-2"></i>
                    Google
                  </Button>
                </div>
              </form>
            </Form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <Button 
              variant="link" 
              className="ml-1 p-0 font-medium text-primary hover:text-blue-500"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

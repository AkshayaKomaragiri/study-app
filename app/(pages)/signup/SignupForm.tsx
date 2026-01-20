"use client"
import { Button } from "@/components/ui/button"
import { useState } from 'react';
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);;
    const router = useRouter()
      const handleSubmit = async () => {
  setLoading(true); // Start loading
  setError("");     // Clear previous errors
  try {
    const response = await fetch(`http://localhost:3000/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, email }),
      
    });
     const result = await response.json();
    
    if (response.ok) {
      setName('');
      setEmail('');
      setPassword('');
      // You may want to redirect the user to /login here
      
      localStorage.setItem("jwt", JSON.stringify(result));
      window.dispatchEvent(new Event("user-login"));
      router.push("/classes");
    } else {
      setError(result.error || result.message || 'Registration failed');
    }
  } catch (err: any) {
    setError('Failed to connect to the server');
    console.log(err.message)
  } finally {
    setLoading(false); // Stop loading regardless of outcome
  }
};

  

    return (
     <div>
        {loading ? (
           <svg className="mr-3 size-5 animate-spin ..." viewBox="0 0 24 24"></svg>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      handleSubmit();
                    }}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" type="text" placeholder="John Doe" required onChange={e => setName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={e => setEmail(e.target.value)} 
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" required  onChange={e => setPassword(e.target.value)}/>
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input id="confirm-password" type="password" required onChange={e => setConfirmPassword(e.target.value)}/>
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field> 

                <p>{error}</p>
                <Button type="submit">Create Account</Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form >
      </CardContent>
    </Card>
        )}
      </div>
  )

}

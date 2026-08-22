import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Compass, Eye, EyeOff, LockKeyhole, Mail, MapPin, UserRound, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { uploadAvatar } from "@/lib/globetrotterData";

type Mode = "login" | "register" | "forgot" | "reset";

export default function AuthPage({ mode = "login" }: { mode?: Mode }) {
  const [, navigate] = useLocation();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Registration Avatar Photo Upload State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [message, setMessage] = useState("");
  const [inlineError, setInlineError] = useState("");

  useEffect(() => {
    setMessage("");
    setInlineError("");
    if (mode === "reset" && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) setEmail(data.user.email);
      });
    }
  }, [mode]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setInlineError("");

    if (!supabase) {
      toast.error("Supabase configuration is not available.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset`,
        });
        if (error) throw error;
        setMessage("Check your email for a password reset link.");
      } else if (mode === "reset") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await refreshProfile();
        toast.success("Password updated successfully. Welcome back!");
        navigate("/");
      } else if (mode === "register") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters long.");
        if (password !== confirm) throw new Error("Passwords do not match.");

        const cleanEmail = email.trim().toLowerCase();

        // 1. Attempt Supabase Auth Sign Up
        let currentUser: any = null;
        let signUpErr: any = null;

        const { data: signUpData, error: err1 } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            },
          },
        });

        if (err1) {
          signUpErr = err1;
          // Fallback: Retry simple signUp without metadata if metadata trigger failed
          const { data: fallbackData, error: err2 } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
          });
          if (!err2 && fallbackData?.user) {
            currentUser = fallbackData.user;
            signUpErr = null;
          }
        } else {
          currentUser = signUpData?.user || null;
        }

        // If signup failed or returned user already registered (422 status), attempt auto sign-in
        if (signUpErr || !currentUser) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!signInErr && signInData.user) {
            currentUser = signInData.user;
          } else {
            if (/already|registered|exists/i.test(signUpErr?.message || "") || signUpErr?.status === 422) {
              setInlineError("Email already registered, please sign in");
              return;
            }
            throw signUpErr || new Error("Registration failed. Please check your details.");
          }
        }

        if (currentUser) {
          let uploadedAvatarUrl = avatarPreview || null;

          if (avatarFile) {
            try {
              uploadedAvatarUrl = await uploadAvatar(avatarFile);
            } catch (storageErr) {
              console.error("Avatar storage upload fallback:", storageErr);
            }
          }

          // Save profile in Supabase profiles database table
          const profilePayload = {
            id: currentUser.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim() || null,
            city: city.trim() || null,
            country: country.trim() || null,
            additional_info: additionalInfo.trim() || null,
            avatar_url: uploadedAvatarUrl,
            role: cleanEmail === "admin123@gmail.com" ? "admin" : "user",
          };

          const { error: profileErr } = await supabase.from("profiles").upsert(profilePayload);

          if (profileErr) {
            console.warn("Full profile creation fallback:", profileErr);
            try {
              await supabase.from("profiles").upsert({
                id: currentUser.id,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                avatar_url: uploadedAvatarUrl,
                role: cleanEmail === "admin123@gmail.com" ? "admin" : "user",
              });
            } catch (e) {
              console.error("Profile creation notice:", e);
            }
          }

          await refreshProfile();
          toast.success("Account created successfully! Welcome to GlobeTrotter.");

          if (cleanEmail === "admin123@gmail.com") {
            navigate("/admin");
          } else {
            navigate("/");
          }
        } else {
          toast.success("Registration initiated! Please sign in with your email.");
          navigate("/login");
        }
      } else {
        // Login mode
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        await refreshProfile();

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        const role = profile?.role || (cleanEmail === "admin123@gmail.com" ? "admin" : "user");
        toast.success("Logged in successfully!");

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      if (/already|registered|exists/i.test(err.message || "")) {
        setInlineError("Email already exists, please sign in");
      } else {
        toast.error(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "register"
      ? "Create your account"
      : mode === "forgot"
      ? "Reset your password"
      : mode === "reset"
      ? "Choose a new password"
      : "Welcome back";

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="brand auth-brand">
          <span className="brand-mark">
            <Compass size={21} />
          </span>
          <span>
            globe<span>trotter</span>
          </span>
        </div>
        <div className="auth-quote">
          <p className="eyebrow">Travel is better when it’s yours</p>
          <h1>
            Plan less.<br />
            <em>Experience more.</em>
          </h1>
          <p>
            Build customized multi-city itineraries, estimate trip budgets automatically, and share your adventures in one calm, connected space.
          </p>
          <div className="auth-places">
            <span>
              <MapPin size={14} /> Global destinations
            </span>
            <span>
              <UserRound size={14} /> Smart travel community
            </span>
          </div>
        </div>
        <div className="auth-image" />
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <p className="eyebrow accent-text">
            GlobeTrotter / {mode === "login" ? "Sign in" : mode}
          </p>
          <h2>{title}</h2>
          <p className="auth-sub">
            {mode === "login"
              ? "Pick up where your next adventure begins."
              : mode === "register"
              ? "Start building personalized trips worth remembering."
              : "We’ll help you get back to your travel plans."}
          </p>

          {message && <div className="success-message">{message}</div>}
          {inlineError && (
            <div className="auth-error p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs mb-4">
              {inlineError} — <Link href="/login" className="font-bold underline text-[#2ca999]">Sign in now</Link>
            </div>
          )}

          <form onSubmit={submit}>
            {mode === "register" && (
              <>
                {/* Centered Circular Photo Picker */}
                <div className="flex flex-col items-center justify-center my-4">
                  <label className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#2ca999] bg-[#e1f1ed] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-solid group-hover:shadow-md">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-[#2ca999]">
                          <Camera size={26} />
                          <span className="text-xs font-bold mt-1">Photo</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold">
                      {avatarPreview ? "Change" : "Upload"}
                    </div>
                  </label>
                  <span className="text-[11px] text-[#789092] mt-1">Click to add profile photo</span>
                </div>

                <div className="auth-two">
                  <label>
                    First name
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      required
                    />
                  </label>
                  <label>
                    Last name
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </label>
                </div>

                <div className="auth-two">
                  <label>
                    Phone number
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </label>
                  <label>
                    City
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ahmedabad / San Francisco"
                    />
                  </label>
                </div>

                <label>
                  Country
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India / United States"
                  />
                </label>

                <label>
                  Additional information
                  <Textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Tell us about your travel preferences or goals..."
                    rows={2}
                  />
                </label>
              </>
            )}

            {mode === "reset" ? (
              <label>
                Email address
                <Input value={email} readOnly placeholder="Your account email" />
              </label>
            ) : (
              <label>
                Email address
                <div className="input-icon">
                  <Mail size={16} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </label>
            )}

            {mode !== "forgot" && (
              <label>
                {mode === "reset" ? "New password" : "Password"}
                <div className="input-icon">
                  <LockKeyhole size={16} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            )}

            {mode === "register" && (
              <label>
                Confirm password
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </label>
            )}

            {mode === "login" && (
              <div className="auth-row">
                <span>Secure sign in</span>
                <Link href="/forgot">Forgot password?</Link>
              </div>
            )}

            <Button className="primary-button auth-submit" disabled={loading}>
              {loading
                ? "Please wait…"
                : mode === "login"
                ? "Sign in"
                : mode === "register"
                ? "Create account"
                : mode === "forgot"
                ? "Send reset link"
                : "Update password"}
              <ArrowRight size={16} />
            </Button>
          </form>

          {mode === "login" ? (
            <p className="auth-switch">
              New to GlobeTrotter? <Link href="/register">Create an account</Link>
            </p>
          ) : mode === "register" ? (
            <p className="auth-switch">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          ) : (
            <p className="auth-switch">
              <Link href="/login">Back to sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

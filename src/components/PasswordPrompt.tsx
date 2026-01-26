import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, X } from "lucide-react";

interface PasswordPromptProps {
    isOpen: boolean;
    onSubmit: (password: string) => void;
    onCancel: () => void;
    isError?: boolean;
}

export function PasswordPrompt({ isOpen, onSubmit, onCancel, isError }: PasswordPromptProps) {
    const [password, setPassword] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(password);
        setPassword(""); // Clear for security
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card text-card-foreground w-full max-w-md p-6 rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold tracking-tight">Protected PDF</h2>
                    </div>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-muted-foreground mb-6">
                    This document is password protected. Please enter the password to view it.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={isError ? "border-destructive focus-visible:ring-destructive/30" : ""}
                            autoFocus
                        />
                        {isError && (
                            <p className="text-sm text-destructive font-medium animate-pulse">
                                Incorrect password. Please try again.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Unlock Document
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

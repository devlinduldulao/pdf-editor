import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, X, Eye, EyeOff, AlertTriangle } from "lucide-react";

/**
 * PasswordProtectModal Component
 *
 * This component provides PDF password protection and encryption:
 * - Set a password to open the PDF
 * - Set permissions (print, copy, edit)
 * - Configure encryption strength
 *
 * How PDF password protection works:
 * 1. User sets an "open" password (required to view the PDF)
 * 2. Optionally sets a "permissions" password (for editing/changing settings)
 * 3. Configures what actions are allowed (print, copy text, modify)
 * 4. When saving, the PDF is encrypted with the specified settings
 *
 * Note: pdf-lib has limited encryption support. For full encryption,
 * you would need a server-side solution or a more advanced PDF library.
 * This implementation provides a UI for configuration that can be
 * extended when encryption support is available.
 *
 * Security Levels:
 * - Open Password: Prevents unauthorized viewing
 * - Permissions Password: Prevents unauthorized modifications
 * - Permission Restrictions: Limits what users can do even after opening
 *
 * @example
 * <PasswordProtectModal
 *   isOpen={isPasswordModalOpen}
 *   onClose={() => setIsPasswordModalOpen(false)}
 *   onApply={handleApplyPasswordProtection}
 * />
 */

export interface PasswordProtectionConfig {
  // User password - required to open the document
  openPassword: string;
  // Owner password - required to change permissions/encryption
  permissionsPassword: string;
  // Permission flags
  permissions: {
    printing: boolean;
    copying: boolean;
    modifying: boolean;
    annotating: boolean;
    fillingForms: boolean;
  };
  // Encryption level
  encryptionLevel: EncryptionLevel;
}

export type EncryptionLevel = "128-bit-aes" | "256-bit-aes" | "128-bit-rc4";

interface PasswordProtectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: PasswordProtectionConfig) => void;
}

const ENCRYPTION_LEVELS: { value: EncryptionLevel; label: string; description: string }[] = [
  {
    value: "256-bit-aes",
    label: "256-bit AES",
    description: "Strongest encryption (Acrobat 9+)",
  },
  {
    value: "128-bit-aes",
    label: "128-bit AES",
    description: "Strong encryption (Acrobat 7+)",
  },
  {
    value: "128-bit-rc4",
    label: "128-bit RC4",
    description: "Legacy encryption (Acrobat 5+)",
  },
];

const DEFAULT_CONFIG: PasswordProtectionConfig = {
  openPassword: "",
  permissionsPassword: "",
  permissions: {
    printing: true,
    copying: true,
    modifying: false,
    annotating: true,
    fillingForms: true,
  },
  encryptionLevel: "256-bit-aes",
};

const PasswordProtectModal: React.FC<PasswordProtectModalProps> = memo(({
  isOpen,
  onClose,
  onApply,
}) => {
  const [config, setConfig] = useState<PasswordProtectionConfig>(DEFAULT_CONFIG);
  const [showOpenPassword, setShowOpenPassword] = useState(false);
  const [showPermissionsPassword, setShowPermissionsPassword] = useState(false);
  const [confirmOpenPassword, setConfirmOpenPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /**
   * Updates a configuration field.
   */
  const updateConfig = useCallback(<K extends keyof PasswordProtectionConfig>(
    key: K,
    value: PasswordProtectionConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setPasswordError(null);
  }, []);

  /**
   * Updates a permission flag.
   */
  const updatePermission = useCallback((
    permission: keyof PasswordProtectionConfig["permissions"],
    value: boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [permission]: value },
    }));
  }, []);

  /**
   * Validates and applies the password protection.
   */
  const handleApply = useCallback(() => {
    // Validate open password
    if (!config.openPassword) {
      setPasswordError("Please enter a password to protect the document");
      return;
    }

    // Check password length
    if (config.openPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    // Check password confirmation
    if (config.openPassword !== confirmOpenPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // Apply configuration
    onApply(config);
    onClose();

    // Reset form
    setConfig(DEFAULT_CONFIG);
    setConfirmOpenPassword("");
  }, [config, confirmOpenPassword, onApply, onClose]);

  /**
   * Calculates password strength.
   */
  const getPasswordStrength = useCallback((password: string): {
    level: "weak" | "medium" | "strong";
    color: string;
    width: string;
  } => {
    if (!password) return { level: "weak", color: "bg-muted", width: "0%" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score >= 4) return { level: "strong", color: "bg-green-500", width: "100%" };
    if (score >= 2) return { level: "medium", color: "bg-yellow-500", width: "66%" };
    return { level: "weak", color: "bg-red-500", width: "33%" };
  }, []);

  const passwordStrength = getPasswordStrength(config.openPassword);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Password Protection</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Warning Banner */}
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Important</p>
              <p className="text-yellow-600 dark:text-yellow-500">
                If you forget the password, the document cannot be recovered.
                Store your password in a safe place.
              </p>
            </div>
          </div>

          {/* Open Password */}
          <div className="space-y-2">
            <Label htmlFor="open-password">Document Password</Label>
            <div className="relative">
              <Input
                id="open-password"
                type={showOpenPassword ? "text" : "password"}
                value={config.openPassword}
                onChange={(e) => updateConfig("openPassword", e.target.value)}
                placeholder="Enter password..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenPassword(!showOpenPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOpenPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {config.openPassword && (
              <div className="space-y-1">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <p className={`text-xs ${
                  passwordStrength.level === "strong" ? "text-green-600" :
                  passwordStrength.level === "medium" ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  Password strength: {passwordStrength.level}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmOpenPassword}
              onChange={(e) => {
                setConfirmOpenPassword(e.target.value);
                setPasswordError(null);
              }}
              placeholder="Re-enter password..."
            />
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
          </div>

          {/* Encryption Level */}
          <div className="space-y-2">
            <Label>Encryption Level</Label>
            <select
              value={config.encryptionLevel}
              onChange={(e) => updateConfig("encryptionLevel", e.target.value as EncryptionLevel)}
              className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background"
            >
              {ENCRYPTION_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions */}
          <div className="space-y-3 pt-2">
            <Label>Allowed Actions (when document is opened)</Label>
            <div className="space-y-2 pl-1">
              {([
                { key: "printing", label: "Allow Printing" },
                { key: "copying", label: "Allow Copying Text & Images" },
                { key: "modifying", label: "Allow Modifying Content" },
                { key: "annotating", label: "Allow Adding Annotations" },
                { key: "fillingForms", label: "Allow Filling Forms" },
              ] as const).map((perm) => (
                <div key={perm.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`perm-${perm.key}`}
                    checked={config.permissions[perm.key]}
                    onCheckedChange={(checked) =>
                      updatePermission(perm.key, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`perm-${perm.key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {perm.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Password (Advanced) */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label htmlFor="permissions-password">
              Permissions Password
              <span className="text-muted-foreground font-normal"> (optional)</span>
            </Label>
            <div className="relative">
              <Input
                id="permissions-password"
                type={showPermissionsPassword ? "text" : "password"}
                value={config.permissionsPassword}
                onChange={(e) => updateConfig("permissionsPassword", e.target.value)}
                placeholder="Required to change permissions..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPermissionsPassword(!showPermissionsPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPermissionsPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              This password is required to change security settings or permissions.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} className="gap-2">
            <Lock className="w-4 h-4" />
            Protect Document
          </Button>
        </div>
      </div>
    </div>
  );
});

PasswordProtectModal.displayName = "PasswordProtectModal";

export default PasswordProtectModal;

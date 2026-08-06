import * as z from "zod";

export const SignupFormSchema = z.object({
  householdName: z.string().min(2, { error: "Le nom du foyer doit contenir au moins 2 caractères." }).trim(),
  name: z.string().min(2, { error: "Le nom doit contenir au moins 2 caractères." }).trim(),
  email: z.email({ error: "Merci de saisir un email valide." }).trim(),
  password: z
    .string()
    .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères." })
    .regex(/[a-zA-Z]/, { error: "Doit contenir au moins une lettre." })
    .regex(/[0-9]/, { error: "Doit contenir au moins un chiffre." })
    .trim(),
});

export type SignupFormState =
  | {
      errors?: {
        householdName?: string[];
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const LoginFormSchema = z.object({
  email: z.email({ error: "Merci de saisir un email valide." }).trim(),
  password: z.string().min(1, { error: "Le mot de passe est requis." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type SessionPayload = {
  userId: string;
  role: "OWNER" | "MEMBER";
  expiresAt: Date;
};

export const ACCOUNT_TYPES = ["CHECKING", "SAVINGS", "CASH", "OTHER"] as const;
export const ACCOUNT_OWNERSHIPS = ["INDIVIDUAL", "JOINT"] as const;

export const AccountFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Le nom du compte est requis." }),
  type: z.enum(ACCOUNT_TYPES, { error: "Type de compte invalide." }),
  ownership: z.enum(ACCOUNT_OWNERSHIPS, { error: "Type de propriété invalide." }),
  currentBalance: z.coerce.number({ error: "Le solde est requis." }),
  // Chaîne JSON d'IDs de membres, rempli par le client uniquement quand ownership = JOINT.
  memberIds: z.string().nullish(),
});

export type AccountFormState =
  | {
      errors?: { name?: string[]; type?: string[]; ownership?: string[]; currentBalance?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const CATEGORY_KINDS = ["EXPENSE", "INCOME"] as const;

export const CategoryFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Le nom de la catégorie est requis." }),
  kind: z.enum(CATEGORY_KINDS, { error: "Type invalide." }),
  color: z.string().trim().nullish(),
});

export type CategoryFormState =
  | {
      errors?: { name?: string[]; kind?: string[]; color?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const TRANSACTION_TYPES = ["EXPENSE", "INCOME", "TRANSFER", "DIRECT_DEBIT"] as const;

export const TransactionFormSchema = z.object({
  accountId: z.string().min(1, { error: "Merci de choisir un compte." }),
  categoryId: z.string().trim().nullish(),
  amount: z.coerce
    .number({ error: "Le montant est requis." })
    .positive({ error: "Le montant doit être positif." }),
  date: z.string().min(1, { error: "La date est requise." }),
  label: z.string().trim().min(1, { error: "Le libellé est requis." }),
  note: z.string().trim().nullish(),
  type: z.enum(TRANSACTION_TYPES, { error: "Type invalide." }),
  isShared: z.coerce.boolean().optional(),
  // Chaîne JSON de { userId, shareAmount }[], champ caché rempli par le client uniquement
  // quand isShared est coché — absent du DOM sinon, d'où le .nullish().
  splits: z.string().nullish(),
});

export type TransactionFormState =
  | {
      errors?: {
        accountId?: string[];
        categoryId?: string[];
        amount?: string[];
        date?: string[];
        label?: string[];
        note?: string[];
        type?: string[];
        splits?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const BudgetFormSchema = z.object({
  categoryId: z.string().min(1, { error: "Merci de choisir une catégorie." }),
  month: z.string().min(1, { error: "Le mois est requis." }),
  plannedAmount: z.coerce
    .number({ error: "Le montant est requis." })
    .min(0, { error: "Doit être positif ou nul." }),
});

export type BudgetFormState =
  | {
      errors?: { categoryId?: string[]; month?: string[]; plannedAmount?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const SavingsGoalFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Le nom de l'objectif est requis." }),
  targetAmount: z.coerce
    .number({ error: "Le montant cible est requis." })
    .positive({ error: "Le montant cible doit être positif." }),
  currentAmount: z.coerce.number().min(0).optional(),
  targetDate: z.string().trim().nullish(),
  monthlyContribution: z.coerce.number().min(0).optional(),
});

export type SavingsGoalFormState =
  | {
      errors?: {
        name?: string[];
        targetAmount?: string[];
        currentAmount?: string[];
        targetDate?: string[];
        monthlyContribution?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const RecurringBillFormSchema = z.object({
  label: z.string().trim().min(1, { error: "Le libellé est requis." }),
  amount: z.coerce
    .number({ error: "Le montant est requis." })
    .positive({ error: "Le montant doit être positif." }),
  kind: z.enum(CATEGORY_KINDS, { error: "Type invalide." }).optional(),
  dueDayOfMonth: z.coerce
    .number({ error: "Le jour d'échéance est requis." })
    .int()
    .min(1, { error: "Doit être entre 1 et 31." })
    .max(31, { error: "Doit être entre 1 et 31." }),
  categoryId: z.string().trim().nullish(),
  accountId: z.string().trim().nullish(),
  reminderDaysBefore: z.coerce.number().int().min(0).max(30).optional(),
});

export type RecurringBillFormState =
  | {
      errors?: {
        label?: string[];
        amount?: string[];
        dueDayOfMonth?: string[];
        categoryId?: string[];
        accountId?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const OneOffPurchaseFormSchema = z.object({
  label: z.string().trim().min(1, { error: "Le nom de l'achat est requis." }),
  amount: z.coerce
    .number({ error: "Le montant est requis." })
    .positive({ error: "Le montant doit être positif." }),
  occasion: z.string().trim().nullish(),
});

export type OneOffPurchaseFormState =
  | {
      errors?: { label?: string[]; amount?: string[]; occasion?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const InviteMemberFormSchema = z.object({
  email: z.email({ error: "Merci de saisir un email valide." }).trim(),
});

export type InviteMemberFormState =
  | {
      errors?: { email?: string[] };
      message?: string;
      inviteUrl?: string;
    }
  | undefined;

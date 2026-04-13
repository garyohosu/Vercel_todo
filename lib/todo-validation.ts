import type {
  CreateTodoInput,
  CreateTodoValues,
  UpdateTodoInput,
  UpdateTodoValues
} from '@/types/todo';
import { TODO_PRIORITY, TODO_STATUS } from '@/types/todo';

export type ValidationResult =
  | { success: true; data: CreateTodoValues }
  | { success: false; fieldErrors: Record<string, string> };

export type UpdateValidationResult =
  | { success: true; data: UpdateTodoValues }
  | { success: false; fieldErrors: Record<string, string> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isTodoPriority(value: unknown): value is CreateTodoInput['priority'] {
  return typeof value === 'string' && TODO_PRIORITY.includes(value as (typeof TODO_PRIORITY)[number]);
}

function isTodoStatus(value: unknown): value is UpdateTodoInput['status'] {
  return typeof value === 'string' && TODO_STATUS.includes(value as (typeof TODO_STATUS)[number]);
}

function normalizeBaseTodoInput(input: unknown) {
  if (!isRecord(input)) {
    return {
      title: '',
      description: '',
      dueDate: '',
      priority: undefined,
      rawStatus: undefined
    };
  }

  return {
    title: typeof input.title === 'string' ? input.title.trim() : '',
    description:
      typeof input.description === 'string' ? input.description.trim() : '',
    dueDate: typeof input.dueDate === 'string' ? input.dueDate.trim() : '',
    priority: input.priority,
    rawStatus: input.status
  };
}

function collectBaseFieldErrors(input: {
  title: string;
  description: string;
  dueDate: string;
  priority: unknown;
}) {
  const fieldErrors: Record<string, string> = {};

  if (input.title.length === 0) {
    fieldErrors.title = 'Title is required';
  } else if (input.title.length > 200) {
    fieldErrors.title = 'Title must be 200 characters or fewer';
  }

  if (input.description.length > 1000) {
    fieldErrors.description = 'Description must be 1000 characters or fewer';
  }

  if (input.dueDate.length > 0 && !isValidDateOnly(input.dueDate)) {
    fieldErrors.dueDate = 'Due date must be a valid date';
  }

  if (
    input.priority !== undefined &&
    input.priority !== null &&
    !isTodoPriority(input.priority)
  ) {
    fieldErrors.priority = 'Priority must be low, medium, or high';
  }

  return fieldErrors;
}

export function validateCreateTodoInput(input: unknown): ValidationResult {
  const normalized = normalizeBaseTodoInput(input);
  const fieldErrors = collectBaseFieldErrors(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors
    };
  }

  return {
    success: true,
    data: {
      title: normalized.title,
      description: normalized.description || null,
      priority: (normalized.priority as CreateTodoInput['priority']) ?? 'medium',
      dueDate: normalized.dueDate || null
    }
  };
}

export function validateUpdateTodoInput(input: unknown): UpdateValidationResult {
  const normalized = normalizeBaseTodoInput(input);
  const fieldErrors = collectBaseFieldErrors(normalized);

  if (!isTodoStatus(normalized.rawStatus)) {
    fieldErrors.status = 'Status must be todo, doing, or done';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors
    };
  }

  return {
    success: true,
    data: {
      title: normalized.title,
      description: normalized.description || null,
      priority: normalized.priority as UpdateTodoInput['priority'],
      dueDate: normalized.dueDate || null,
      status: normalized.rawStatus as UpdateTodoInput['status']
    }
  };
}

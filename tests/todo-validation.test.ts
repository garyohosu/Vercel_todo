import { describe, expect, it } from 'vitest';

import {
  validateCreateTodoInput,
  validateUpdateTodoInput
} from '@/lib/todo-validation';

describe('validateCreateTodoInput', () => {
  it('accepts a title-only payload and applies defaults', () => {
    const result = validateCreateTodoInput({
      title: '買い物'
    });

    expect(result).toEqual({
      success: true,
      data: {
        title: '買い物',
        description: null,
        priority: 'medium',
        dueDate: null
      }
    });
  });

  it('rejects an empty title', () => {
    const result = validateCreateTodoInput({
      title: ''
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        title: 'Title is required'
      }
    });
  });

  it('rejects a title longer than 200 chars', () => {
    const result = validateCreateTodoInput({
      title: 'a'.repeat(201)
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        title: 'Title must be 200 characters or fewer'
      }
    });
  });

  it('rejects a description longer than 1000 chars', () => {
    const result = validateCreateTodoInput({
      title: '買い物',
      description: 'a'.repeat(1001)
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        description: 'Description must be 1000 characters or fewer'
      }
    });
  });

  it('rejects an invalid due date', () => {
    const result = validateCreateTodoInput({
      title: '買い物',
      dueDate: '2024-13-01'
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        dueDate: 'Due date must be a valid date'
      }
    });
  });

  it('rejects an invalid priority', () => {
    const result = validateCreateTodoInput({
      title: '買い物',
      priority: 'urgent'
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        priority: 'Priority must be low, medium, or high'
      }
    });
  });
});

describe('validateUpdateTodoInput', () => {
  it('accepts a valid payload with status', () => {
    const result = validateUpdateTodoInput({
      title: '買い物',
      description: '牛乳',
      dueDate: '2026-04-20',
      priority: 'high',
      status: 'doing'
    });

    expect(result).toEqual({
      success: true,
      data: {
        title: '買い物',
        description: '牛乳',
        dueDate: '2026-04-20',
        priority: 'high',
        status: 'doing'
      }
    });
  });

  it('rejects an invalid status', () => {
    const result = validateUpdateTodoInput({
      title: '買い物',
      priority: 'medium',
      status: 'paused'
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        status: 'Status must be todo, doing, or done'
      }
    });
  });
});

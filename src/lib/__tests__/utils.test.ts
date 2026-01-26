import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
    it('should merge class names', () => {
        const result = cn('class1', 'class2');
        expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
        const result = cn('base', true && 'conditional', false && 'hidden');
        expect(result).toBe('base conditional');
    });

    it('should merge tailwind classes correctly', () => {
        const result = cn('px-2', 'px-4');
        expect(result).toBe('px-4');
    });

    it('should handle arrays of classes', () => {
        const result = cn(['class1', 'class2'], 'class3');
        expect(result).toBe('class1 class2 class3');
    });

    it('should handle objects with boolean values', () => {
        const result = cn({
            'class1': true,
            'class2': false,
            'class3': true,
        });
        expect(result).toBe('class1 class3');
    });

    it('should handle undefined and null values', () => {
        const result = cn('class1', undefined, null, 'class2');
        expect(result).toBe('class1 class2');
    });

    it('should handle empty strings', () => {
        const result = cn('class1', '', 'class2');
        expect(result).toBe('class1 class2');
    });

    it('should handle complex tailwind merging', () => {
        const result = cn('bg-red-500', 'bg-blue-500');
        expect(result).toBe('bg-blue-500');
    });

    it('should handle padding and margin overrides', () => {
        const result = cn('p-4 m-2', 'p-8');
        expect(result).toBe('m-2 p-8');
    });

    it('should handle width and height overrides', () => {
        const result = cn('w-10 h-10', 'w-20');
        expect(result).toBe('h-10 w-20');
    });

    it('should preserve non-conflicting classes', () => {
        const result = cn('text-center', 'bg-blue-500', 'hover:bg-blue-700');
        expect(result).toBe('text-center bg-blue-500 hover:bg-blue-700');
    });

    it('should handle responsive prefixes', () => {
        const result = cn('text-sm', 'md:text-lg', 'lg:text-xl');
        expect(result).toBe('text-sm md:text-lg lg:text-xl');
    });

    it('should handle pseudo-class prefixes', () => {
        const result = cn('hover:bg-red-500', 'focus:bg-blue-500');
        expect(result).toBe('hover:bg-red-500 focus:bg-blue-500');
    });

    it('should merge complex class combinations', () => {
        const baseClasses = 'px-4 py-2 rounded';
        const variantClasses = 'bg-primary text-white';
        const stateClasses = 'hover:bg-primary/90';
        
        const result = cn(baseClasses, variantClasses, stateClasses);
        expect(result).toContain('px-4');
        expect(result).toContain('py-2');
        expect(result).toContain('rounded');
        expect(result).toContain('bg-primary');
        expect(result).toContain('text-white');
        expect(result).toContain('hover:bg-primary/90');
    });

    it('should return empty string for no arguments', () => {
        const result = cn();
        expect(result).toBe('');
    });

    it('should handle mixed types', () => {
        const result = cn(
            'base',
            ['array1', 'array2'],
            { conditional: true, hidden: false },
            undefined,
            'final'
        );
        expect(result).toContain('base');
        expect(result).toContain('array1');
        expect(result).toContain('array2');
        expect(result).toContain('conditional');
        expect(result).not.toContain('hidden');
        expect(result).toContain('final');
    });
});

import { unflattenObject } from './objectFlatter.util.js';

describe('unflattenObject', () => {
    it('should unflatten a simple object structure', () => {
        const flattenedData = [
            [
                { key: 'name', value: 'John Doe' },
                { key: 'age', value: 30 },
            ],
        ];
        const expected = [{ name: 'John Doe', age: 30 }];
        expect(unflattenObject(flattenedData)).toEqual(expected);
    });

    it('should unflatten nested objects', () => {
        const flattenedData = [
            [
                { key: 'user#name', value: 'Jane Doe' },
                { key: 'user#address#street', value: '123 Main St' },
                { key: 'user#address#city', value: 'Anytown' },
            ],
        ];
        const expected = [
            {
                user: {
                    name: 'Jane Doe',
                    address: { street: '123 Main St', city: 'Anytown' },
                },
            },
        ];
        expect(unflattenObject(flattenedData)).toEqual(expected);
    });

    it('should unflatten arrays', () => {
        const flattenedData = [
            [
                { key: 'items[0]', value: 'apple' },
                { key: 'items[1]', value: 'banana' },
            ],
        ];
        const expected = [{ items: ['apple', 'banana'] }];
        expect(unflattenObject(flattenedData)).toEqual(expected);
    });

    it('should unflatten arrays of objects', () => {
        const flattenedData = [
            [
                { key: 'users[0]#id', value: 1 },
                { key: 'users[0]#name', value: 'Alice' },
                { key: 'users[1]#id', value: 2 },
                { key: 'users[1]#name', value: 'Bob' },
            ],
        ];
        const expected = [
            {
                users: [
                    { id: 1, name: 'Alice' },
                    { id: 2, name: 'Bob' },
                ],
            },
        ];
        expect(unflattenObject(flattenedData)).toEqual(expected);
    });

    it('should handle multiple entries in the input array', () => {
        const flattenedData = [
            [
                { key: 'id', value: 1 },
                { key: 'data#value', value: 'first' }
            ],
            [
                { key: 'id', value: 2 },
                { key: 'data#value', value: 'second' }
            ]
        ];
        const expected = [
            { id: 1, data: { value: 'first' } },
            { id: 2, data: { value: 'second' } }
        ];
        expect(unflattenObject(flattenedData)).toEqual(expected);
    });

    it('should handle complex nested structures with arrays and objects', () => {
        const flattenedData = [
            [
                { key: 'order#id', value: 'xyz123' },
                { key: 'order#customer#name', value: 'John Doe' },
                { key: 'order#items[0]#product#name', value: 'Laptop' },
                { key: 'order#items[0]#product#price', value: 1200 },
                { key: 'order#items[0]#quantity', value: 1 },
                { key: 'order#items[1]#product#name', value: 'Mouse' },
                { key: 'order#items[1]#product#price', value: 25 },
                { key: 'order#items[1]#quantity', value: 2 },
            ],
        ];
        const expected = [
            {
                order: {
                    id: 'xyz123',
                    customer: { name: 'John Doe' },
                    items: [
                        { product: { name: 'Laptop', price: 1200 }, quantity: 1 },
                        { product: { name: 'Mouse', price: 25 }, quantity: 2 },
                    ],
                },
            },
        ];
        expect(unflattenObject(flattenedData)).toEqual(expected);
    });

    it('should return an array of empty objects for empty input array', () => {
        expect(unflattenObject([])).toEqual([]);
    });

    it('should return an array with an empty object if the inner array is empty', () => {
        const flattenedData = [[]];
        const expected = [{}];
        expect(unflattenObject(flattenedData)).toEqual(expected);
    });

    it('should throw an error if a key is not a string', () => {
        const flattenedData = [
            [
                { key: 123, value: 'test' } // Invalid key
            ]
        ];
        expect(() => unflattenObject(flattenedData)).toThrow('Key must be a string');
    });

    it('should throw an error if a key is an empty string', () => {
        const flattenedData = [
            [
                { key: ' ', value: 'test' } // Invalid key
            ]
        ];
        expect(() => unflattenObject(flattenedData)).toThrow('Key must be a string');
    });
});


class Vector {

    constructor (x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {Vector|Number} x
     * @param {Number} [y]
     * @returns {Vector}
     */
    set(x, y) {
        if (x instanceof Vector) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
        return this;
    }

    clear() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    setSphericalCoordinates(phi, theta) {
        this.x = Math.cos(phi) * Math.sin(theta);
        this.y = Math.sin(theta) * Math.sin(phi);
        return this;
    }

    add(v) {
        return Vector.add(this, v, this);
    }

    subtract(v) {
        return Vector.subtract(this, v, this);
    }

    scale(scalar) {
        return Vector.scale(this, scalar, this);
    }

    get length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    normalize() {
        const len = this.length;
        if (len !== 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }

    limit(maxLength) {
        if (this.length > maxLength) {
            this.normalize().scale(maxLength);
        }
        return this;
    }

    toString() {
        // return `${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)} (${this.length.toFixed(2)})`
        return `${this.length.toFixed(10)}`
    }

    /**
     * @param {Vector} v1
     * @param {Number} scalar
     * @param {Vector} result
     * @returns {Vector} result
     */
    static scale(v1, scalar, result) {
        result.x = v1.x * scalar;
        result.y = v1.y * scalar;
        return result;
    }

    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @param {Vector} result
     * @returns {Vector} result
     */
    static add(v1, v2, result) {
        result.x = v1.x + v2.x;
        result.y = v1.y + v2.y;
        return result;
    }

    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @param {Vector} result
     * @returns {Vector} result
     */
    static subtract(v1, v2, result) {
        result.x = v1.x - v2.x;
        result.y = v1.y - v2.y;
        return result;
    }
}

class Calculator {
    constructor(displayElement, expressionElement, clearBtnElement) {
        this.displayElement = displayElement;
        this.expressionElement = expressionElement;
        this.clearBtnElement = clearBtnElement;
        this.reset();
    }

    reset() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operator = null;
        this.expressionStr = '';
        this.awaitingNextOperand = false;
        this.lastOperator = null;
        this.lastOperand = null;
        this.updateDisplay();
        this.updateClearBtnText();
        this.clearActiveOperator();
    }

    clear() {
        if (this.currentValue !== '0' || this.awaitingNextOperand) {
            this.currentValue = '0';
            this.updateClearBtnText();
            this.updateDisplay();
        } else {
            this.reset();
        }
    }

    backspace() {
        if (this.awaitingNextOperand) return;

        if (this.currentValue.length > 1 && this.currentValue !== 'Error') {
            this.currentValue = this.currentValue.slice(0, -1);
            if (this.currentValue === '-' || this.currentValue === '') {
                this.currentValue = '0';
            }
        } else {
            this.currentValue = '0';
        }
        this.updateClearBtnText();
        this.updateDisplay();
    }

    updateClearBtnText() {
        if (this.clearBtnElement) {
            this.clearBtnElement.textContent = (this.currentValue !== '0' || this.awaitingNextOperand) ? 'C' : 'AC';
        }
    }

    inputDigit(digit) {
        this.clearActiveOperator();

        if (this.awaitingNextOperand) {
            this.currentValue = digit;
            this.awaitingNextOperand = false;
        } else {
            if (this.currentValue === '0') {
                this.currentValue = digit;
            } else {
                if (this.currentValue.replace(/[^0-9]/g, '').length < 9) {
                    this.currentValue += digit;
                }
            }
        }
        this.updateClearBtnText();
        this.updateDisplay();
    }

    inputDecimal() {
        this.clearActiveOperator();

        if (this.awaitingNextOperand) {
            this.currentValue = '0.';
            this.awaitingNextOperand = false;
        } else if (!this.currentValue.includes('.')) {
            this.currentValue += '.';
        }
        this.updateClearBtnText();
        this.updateDisplay();
    }

    toggleSign() {
        if (this.currentValue === '0' || this.currentValue === 'Error') return;
        if (this.currentValue.startsWith('-')) {
            this.currentValue = this.currentValue.slice(1);
        } else {
            this.currentValue = '-' + this.currentValue;
        }
        this.updateDisplay();
    }

    percent() {
        let num = parseFloat(this.currentValue);
        if (isNaN(num)) return;
        this.expressionStr = `${this.formatNumber(this.currentValue)}%`;
        this.currentValue = this.formatResult(num / 100);
        this.updateDisplay();
    }

    handleOperator(nextOperator, operatorButton) {
        const inputValue = parseFloat(this.currentValue);

        if (this.operator && this.awaitingNextOperand) {
            this.operator = nextOperator;
            this.expressionStr = `${this.formatNumber(this.previousValue)}${this.operator}`;
            this.setActiveOperator(operatorButton);
            this.updateDisplay();
            return;
        }

        if (this.previousValue === null && !isNaN(inputValue)) {
            this.previousValue = inputValue;
        } else if (this.operator) {
            const result = this.calculate(this.previousValue, inputValue, this.operator);
            if (result === 'Error') {
                this.displayError();
                return;
            }
            this.currentValue = this.formatResult(result);
            this.previousValue = parseFloat(this.currentValue);
        }

        this.awaitingNextOperand = true;
        this.operator = nextOperator;
        this.lastOperator = null;
        this.lastOperand = null;
        this.expressionStr = `${this.formatNumber(this.previousValue)}${this.operator}`;
        this.setActiveOperator(operatorButton);
        this.updateDisplay();
    }

    compute() {
        let inputValue = parseFloat(this.currentValue);

        if (this.operator !== null) {
            if (this.awaitingNextOperand && this.lastOperand !== null) {
                inputValue = this.lastOperand;
            } else {
                this.lastOperand = inputValue;
                this.lastOperator = this.operator;
            }

            this.expressionStr = `${this.formatNumber(this.previousValue)}${this.operator}${this.formatNumber(inputValue)}`;

            const result = this.calculate(this.previousValue, inputValue, this.operator);
            if (result === 'Error') {
                this.displayError();
                return;
            }

            this.currentValue = this.formatResult(result);
            this.previousValue = parseFloat(this.currentValue);
            this.operator = null;
            this.awaitingNextOperand = true;
        } else if (this.lastOperator && this.lastOperand !== null) {
            this.expressionStr = `${this.formatNumber(inputValue)}${this.lastOperator}${this.formatNumber(this.lastOperand)}`;
            const result = this.calculate(inputValue, this.lastOperand, this.lastOperator);
            if (result === 'Error') {
                this.displayError();
                return;
            }
            this.currentValue = this.formatResult(result);
            this.previousValue = parseFloat(this.currentValue);
        }

        this.clearActiveOperator();
        this.updateDisplay();
    }

    calculate(first, second, op) {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '×':
            case '*': return first * second;
            case '÷':
            case '/':
                if (second === 0) return 'Error';
                return first / second;
            default: return second;
        }
    }

    formatResult(number) {
        if (typeof number === 'string') return number;
        if (isNaN(number) || !isFinite(number)) return 'Error';

        const fixed = parseFloat(number.toFixed(10));
        let str = fixed.toString();

        if (str.length > 9) {
            if (Math.abs(fixed) >= 1e9 || (Math.abs(fixed) < 1e-6 && fixed !== 0)) {
                str = fixed.toExponential(4);
            } else {
                str = parseFloat(fixed.toPrecision(8)).toString();
            }
        }
        return str;
    }

    formatNumber(val) {
        if (val === null || val === undefined) return '';
        const strVal = val.toString();
        if (strVal === 'Error' || strVal.includes('e')) return strVal;
        const parts = strVal.split('.');
        parts[0] = parseInt(parts[0], 10).toLocaleString('en-US') || '0';
        if (strVal.startsWith('-') && parts[0] === '0') parts[0] = '-0';
        return parts.join('.');
    }

    displayError() {
        this.currentValue = 'Error';
        this.previousValue = null;
        this.operator = null;
        this.expressionStr = '';
        this.awaitingNextOperand = true;
        this.updateDisplay();
        this.clearActiveOperator();
    }

    updateDisplay() {
        let displayStr = this.formatNumber(this.currentValue);
        this.displayElement.textContent = displayStr;

        if (this.expressionElement) {
            if (this.operator && !this.awaitingNextOperand) {
                this.expressionElement.textContent = `${this.formatNumber(this.previousValue)}${this.operator}${this.formatNumber(this.currentValue)}`;
            } else {
                this.expressionElement.textContent = this.expressionStr;
            }
        }

        // Dynamic font size adjustment based on text length
        const length = displayStr.length;
        if (length > 9) {
            this.displayElement.style.fontSize = '38px';
        } else if (length > 7) {
            this.displayElement.style.fontSize = '46px';
        } else if (length > 5) {
            this.displayElement.style.fontSize = '54px';
        } else {
            this.displayElement.style.fontSize = '64px';
        }
    }

    setActiveOperator(button) {
        this.clearActiveOperator();
        if (button) {
            button.classList.add('active');
        }
    }

    clearActiveOperator() {
        document.querySelectorAll('.key.operator').forEach(btn => btn.classList.remove('active'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const displayElement = document.getElementById('display');
    const expressionElement = document.getElementById('expression');
    const clearBtnElement = document.getElementById('clear-btn');
    const calculator = new Calculator(displayElement, expressionElement, clearBtnElement);

    // Initial state clean: main display shows 0, expression line is empty/null
    calculator.reset();

    // Event listener for button clicks
    document.querySelectorAll('.key').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const number = target.dataset.number;
            const action = target.dataset.action;
            const operator = target.dataset.operator;

            if (number !== undefined) {
                calculator.inputDigit(number);
            } else if (action === 'decimal') {
                calculator.inputDecimal();
            } else if (action === 'toggle-sign') {
                calculator.toggleSign();
            } else if (action === 'percent') {
                calculator.percent();
            } else if (action === 'clear') {
                calculator.clear();
            } else if (action === 'backspace') {
                calculator.backspace();
            } else if (action === 'operator') {
                calculator.handleOperator(operator, target);
            } else if (action === 'calculate') {
                calculator.compute();
            }
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        if (key >= '0' && key <= '9') {
            calculator.inputDigit(key);
        } else if (key === '.') {
            calculator.inputDecimal();
        } else if (key === '+' || key === '-') {
            const opBtn = document.querySelector(`.key.operator[data-operator="${key === '+' ? '+' : '-'}"]`);
            calculator.handleOperator(key, opBtn);
        } else if (key === '*' || key === 'x') {
            const opBtn = document.querySelector(`.key.operator[data-operator="×"]`);
            calculator.handleOperator('×', opBtn);
        } else if (key === '/') {
            e.preventDefault();
            const opBtn = document.querySelector(`.key.operator[data-operator="÷"]`);
            calculator.handleOperator('÷', opBtn);
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calculator.compute();
        } else if (key === 'Escape') {
            calculator.clear();
        } else if (key === '%') {
            calculator.percent();
        } else if (key === 'Backspace') {
            calculator.backspace();
        }
    });
});

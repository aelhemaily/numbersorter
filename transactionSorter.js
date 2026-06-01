document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const convertBtn = document.getElementById('convertBtn');
    const outputDiv = document.getElementById('output');
    const toolbar = document.getElementById('toolbar');
    const copyDebitColBtn = document.getElementById('copyDebitColBtn');
    const copyCreditColBtn = document.getElementById('copyCreditColBtn');
    const copyBothColsBtn = document.getElementById('copyBothColsBtn');

    // Helper function to show toasts (reused from original main.js)
    function showToast(message, type = 'success') {
        const toast = document.getElementById(type === 'error' ? 'error-toast' : 'toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        toast.classList.remove('error', 'success');
        if (type === 'error') {
            toast.classList.add('error');
            setTimeout(() => toast.classList.remove('show'), 5000);
        } else {
            toast.classList.add('success');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }

    /**
     * Parse a number from a string that may contain:
     * - Dollar signs ($) anywhere (e.g., "$84.38", "64.44$", "($34.43)")
     * - Brackets () to indicate negative numbers (e.g., "(34.34)", "($84.38)")
     * - Standard minus sign for negative numbers (e.g., "-34.34")
     * 
     * Returns a number (positive or negative), or NaN if parsing fails.
     */
    function parseNumberFromString(str) {
        // Remove all dollar signs ($) from the string
        let cleaned = str.replace(/\$/g, '');
        
        // Check if the cleaned string is wrapped in parentheses, which indicates a negative number
        // Match pattern: optional whitespace, opening parenthesis, any characters, closing parenthesis
        const bracketMatch = cleaned.match(/^\s*\((.*)\)\s*$/);
        
        let numericValue;
        
        if (bracketMatch) {
            // It's a bracketed value (negative number)
            const innerValue = bracketMatch[1];
            numericValue = parseFloat(innerValue);
            if (!isNaN(numericValue)) {
                numericValue = -Math.abs(numericValue); // Make it negative
            }
        } else {
            // No brackets, standard parsing (handles minus sign naturally)
            numericValue = parseFloat(cleaned);
        }
        
        return numericValue;
    }

    convertBtn.addEventListener('click', () => {
        const input = inputText.value.trim();
        if (!input) {
            showToast("Please paste numbers into the text area!", "error");
            outputDiv.innerHTML = ''; // Clear previous output
            toolbar.classList.remove('show'); // Hide toolbar
            return;
        }

        const numbers = [];
        const lines = input.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') continue;
            
            const num = parseNumberFromString(trimmedLine);
            if (!isNaN(num)) {
                numbers.push(num);
            }
        }

        if (numbers.length === 0) {
            showToast("No valid numbers found in the input.", "error");
            outputDiv.innerHTML = '';
            toolbar.classList.remove('show');
            return;
        }

        let tableHtml = '</td><thead><tr><th>Debit</th><th>Credit</th></tr></thead><tbody>';

        numbers.forEach(num => {
            tableHtml += '<tr>';
            if (num >= 0) {
                // Positive number goes to Debit column (empty Credit)
                tableHtml += `<td>${num.toFixed(2)}</td><td></td>`;
            } else {
                // Negative number goes to Credit column as positive value (empty Debit)
                tableHtml += `<td></td><td>${Math.abs(num).toFixed(2)}</td>`;
            }
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table>';
        outputDiv.innerHTML = tableHtml;
        toolbar.classList.add('show');
    });

    copyDebitColBtn.addEventListener('click', () => {
        const table = outputDiv.querySelector('table');
        if (!table) {
            showToast("No table to copy from.", "error");
            return;
        }
        const debitColumnData = Array.from(table.rows).slice(1).map(row => row.cells[0].textContent.trim()).join('\n');
        navigator.clipboard.writeText(debitColumnData)
            .then(() => showToast('Debit column copied!'))
            .catch(err => {
                console.error('Failed to copy debit column:', err);
                showToast('Failed to copy debit column.', 'error');
            });
    });

    copyCreditColBtn.addEventListener('click', () => {
        const table = outputDiv.querySelector('table');
        if (!table) {
            showToast("No table to copy from.", "error");
            return;
        }
        const creditColumnData = Array.from(table.rows).slice(1).map(row => row.cells[1].textContent.trim()).join('\n');
        navigator.clipboard.writeText(creditColumnData)
            .then(() => showToast('Credit column copied!'))
            .catch(err => {
                console.error('Failed to copy credit column:', err);
                showToast('Failed to copy credit column.', 'error');
            });
    });

    copyBothColsBtn.addEventListener('click', () => {
        const table = outputDiv.querySelector('table');
        if (!table) {
            showToast("No table to copy from.", "error");
            return;
        }
        const rows = Array.from(table.rows).slice(1); // Skip header row
        const tableData = rows.map(row => {
            const debit = row.cells[0].textContent.trim();
            const credit = row.cells[1].textContent.trim();
            return `${debit}\t${credit}`; // Tab-separated for easy pasting into spreadsheets
        }).join('\n');

        navigator.clipboard.writeText(tableData)
            .then(() => showToast('Both columns copied!'))
            .catch(err => {
                console.error('Failed to copy both columns:', err);
                showToast('Failed to copy both columns.', 'error');
            });
    });

    // Dark Mode Toggle (Reused from original main.js)
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
    }

    // Return to Top Button (Reused from original main.js)
    const returnToTopButton = document.getElementById('returnToTop');
    if (returnToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) { // Show button after scrolling down 200px
                returnToTopButton.classList.add('show');
            } else {
                returnToTopButton.classList.remove('show');
            }
        });
        returnToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

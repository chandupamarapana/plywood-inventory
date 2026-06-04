import * as XLSX from 'xlsx';

export function exportMonthlyReport(items, transactions, fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  // Filter transactions in date range
  const inRange = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d >= from && d <= to;
  });

  const rows = items.map(item => {
    const itemTx = inRange.filter(tx => tx.item.id === item.id);

    const received = itemTx
      .filter(tx => tx.type === 'STOCK_IN')
      .reduce((sum, tx) => sum + tx.quantity, 0);

    const used = itemTx
      .filter(tx => tx.type === 'CONSUMPTION')
      .reduce((sum, tx) => sum + tx.quantity, 0);

    const closing = item.stock + used - received;
    const opening = closing < 0 ? 0 : closing;

    return {
      'Item Name': item.name,
      'Category': item.category.name,
      'Unit': item.category.unit,
      'Opening Stock': opening,
      'Received (Stock In)': received,
      'Used (Consumption)': used,
      'Closing Stock': item.stock + used - received,
      'Current Stock': item.stock,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  // Column widths
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');

  const fileName = `inventory-report-${fromDate}-to-${toDate}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
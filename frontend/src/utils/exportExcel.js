import * as XLSX from "xlsx";

export function exportMonthlyReport(items, transactions, fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999); // include full end day

  const rows = items.map((item) => {
    const itemTx = transactions.filter((tx) => tx.item.id === item.id);

    // Transactions BEFORE the date range — to calculate opening stock
    const beforeRange = itemTx.filter((tx) => new Date(tx.date) < from);

    // Transactions WITHIN the date range
    const inRange = itemTx.filter((tx) => {
      const d = new Date(tx.date);
      return d >= from && d <= to;
    });

    // Opening stock = work backwards from current stock
    // Current stock already reflects all transactions ever
    // So opening = current + what was used after range start - what came in after range start
    const receivedBefore = beforeRange
      .filter((tx) => tx.type === "STOCK_IN")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    const usedBefore = beforeRange
      .filter((tx) => tx.type === "CONSUMPTION")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    // Transactions AFTER the date range
    const afterRange = itemTx.filter((tx) => new Date(tx.date) > to);

    const receivedAfter = afterRange
      .filter((tx) => tx.type === "STOCK_IN")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    const usedAfter = afterRange
      .filter((tx) => tx.type === "CONSUMPTION")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    // Within range
    const receivedInRange = inRange
      .filter((tx) => tx.type === "STOCK_IN")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    const usedInRange = inRange
      .filter((tx) => tx.type === "CONSUMPTION")
      .reduce((sum, tx) => sum + tx.quantity, 0);

    // Opening stock = current stock, reverse out after-range transactions
    const openingStock =
      item.stock + receivedAfter - usedAfter - receivedInRange + usedInRange;

    // Closing stock = opening + received in range - used in range
    const closingStock = openingStock + receivedInRange - usedInRange;

    return {
      "Item Name": item.name,
      Category: item.category.name,
      Unit: item.category.unit,
      "Opening Stock": Math.max(0, openingStock),
      "Received (Stock In)": receivedInRange,
      "Used (Consumption)": usedInRange,
      "Closing Stock": Math.max(0, closingStock),
      "Current Stock": item.stock,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");

  const fileName = `inventory-report-${fromDate}-to-${toDate}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

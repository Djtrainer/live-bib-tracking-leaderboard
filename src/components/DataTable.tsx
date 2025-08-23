import { ReactNode } from 'react';

interface Column {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any, index: number) => ReactNode;
  emptyMessage?: string;
}

export default function DataTable({ columns, data, renderRow, emptyMessage = "No data available" }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                style={{ width: column.width }}
                className={`text-${column.align || 'left'}`}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  );
}
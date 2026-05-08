import { JOB_STATUS, STATUS_COLORS } from '@/lib/config';

type Status = keyof typeof JOB_STATUS;

export default function StatusBadge({ status }: { status: number | string }) {
  const label = typeof status === 'number' ? JOB_STATUS[status as Status] : status;
  const color = STATUS_COLORS[label as keyof typeof STATUS_COLORS] || 'bg-gray-500';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${color}`}>
      {label}
    </span>
  );
}
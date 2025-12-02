import React from "react";

export default function FeatureCard({
	label,
	value,
	color,
	displayValue,
	description,
}: {
	label: string;
	value: number;
	color: string;
	displayValue?: string;
	description?: string;
}) {
	const clampedValue = Math.min(Math.max(value, 0), 1);
	const percentage = Math.round(clampedValue * 100);

	return (
		<div className="bg-neutral-800 border border-neutral-600 p-4 rounded flex flex-col gap-3">
			<div className="flex justify-between items-start">
				<div>
					<span className="text-white font-medium block">{label}</span>
					<span className="text-neutral-500 text-xs">{description}</span>
				</div>
				<span className="text-white font-mono font-bold">
					{displayValue || `${percentage}%`}
				</span>
			</div>

			<div className="w-full h-3 bg-neutral-700 rounded overflow-hidden">
				<div
					className={`h-full ${color}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

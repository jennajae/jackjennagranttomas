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
		<div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
			<div className="flex justify-between items-start">
				<div>
					<span className="text-white font-semibold text-lg block">{label}</span>
					<span className="text-neutral-500 text-xs block mt-1">{description}</span>
				</div>
				<span className="text-white font-mono text-xl font-bold">
					{displayValue || `${percentage}%`}
				</span>
			</div>

			<div className="w-full h-4 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
				<div
					className={`h-full ${color} transition-all duration-1000 ease-out`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

import "../globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Navbar from "@/components/Navbar";
config.autoAddCss = false;

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head />
			<body suppressHydrationWarning>
				<div className="flex flex-col items-center">
					<div className="text-center mt-12 mb-10">
						{/* main logo for site*/}
						<h1 className="text-6xl font-bold text-green-400 mb-2">
							Groovee
						</h1>
						<p className="text-neutral-400 text-sm">a spotify song analyzer</p>
					</div>
					<Navbar />
					<div className="text-white w-full p-4 flex justify-center">{children}</div>
				</div>
			</body>
		</html>
	);
}

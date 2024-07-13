import { memo, useEffect, useRef, useState } from "react";
import { useIsDarkMode } from "@/hooks/theme";
import { Button } from "@/components/ui/button";
import drawDropsTimeline, { TimelineDropsDatum } from "./drawDropsTimeline";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { playerDropCategories } from "@/lib/playerDropCategories";

export type TimelineDropsChartData = {
    selectedPeriod: string;
    startDate: Date;
    endDate: Date;
    maxDrops: number;
    categoriesSorted: string[];
    log: TimelineDropsDatum[];
}

const ChartLabels = memo(({ categories }: { categories: string[] }) => {
    const categoriesReversed = categories.slice().reverse();
    return categoriesReversed.map((catName) => {
        return (
            <div key={catName} className="flex items-center text-sm">
                <div
                    className="size-4 mr-1 rounded-full border dark:border-0"
                    style={{
                        backgroundColor: playerDropCategories[catName].color,
                        borderColor: playerDropCategories[catName].border,
                    }}
                />
                <span className="tracking-wider">
                    {playerDropCategories[catName].label}:
                </span>
                <div className="flex-grow text-right font-semibold min-w-[3ch] text-muted-foreground">
                    <span data-category={catName} />
                </div>
            </div>
        )
    })
});

type TimelineDropsChartProps = {
    width: number;
    height: number;
    chartData: TimelineDropsChartData;
};

function TimelineDropsChart({ chartData, width, height }: TimelineDropsChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [autoAnimateParentRef, enableAnimations] = useAutoAnimate<HTMLDivElement>();
    const legendRef = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState('');
    const [errorRetry, setErrorRetry] = useState(0);
    const isDarkMode = useIsDarkMode();
    const margins = {
        top: 8,
        right: 8,
        bottom: 24,
        left: 42,
        axis: 1
    };

    //Redraw chart when data or size changes
    useEffect(() => {
        if (!chartData || !legendRef.current || !svgRef.current || !canvasRef.current || !width || !height) return;
        if (!chartData.log.length) return; //only in case somehow the api returned, but no data found
        try {
            console.groupCollapsed('Drawing player drops:');
            console.time('drawDropsTimeline');
            drawDropsTimeline({
                legendRef: legendRef.current,
                svgRef: svgRef.current,
                canvasRef: canvasRef.current,
                setRenderError,
                size: { width, height },
                margins,
                isDarkMode,
                data: chartData,
            });
            setErrorRetry(0);
            setRenderError('');
            console.timeEnd('drawDropsTimeline');
        } catch (error) {
            setRenderError((error as Error).message ?? 'Unknown error.');
        } finally {
            console.groupEnd();
        }
    }, [chartData, width, height, isDarkMode, legendRef, svgRef, canvasRef, renderError]);

    if (!width || !height) return null;
    if (renderError) {
        return <div className="absolute inset-0 p-4 flex flex-col gap-4 items-center justify-center text-center text-lg font-mono text-destructive-inline">
            Render Error: {renderError}
            <br />
            <Button
                size={'sm'}
                variant={'outline'}
                className='text-primary'
                onClick={() => {
                    setErrorRetry(c => c + 1);
                    setRenderError('');
                }}
            >
                Retry{errorRetry ? ` (${errorRetry})` : ''}
            </Button>
        </div>
    }
    return (
        <>
            <div
                ref={legendRef}
                style={{
                    zIndex: 2,
                    position: 'absolute',
                    top: `12px`,
                    opacity: 0,
                }}
                className="p-2 rounded-md border shadow-lg dark:bg-zinc-800/90 bg-zinc-200/90 pointer-events-none transition-all"
            >
                <ChartLabels categories={chartData.categoriesSorted} />
            </div>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                style={{
                    zIndex: 1,
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                }}
            />
            <canvas
                ref={canvasRef}
                width={width - margins.left - margins.right}
                height={height - margins.top - margins.bottom}
                style={{
                    zIndex: 0,
                    position: 'absolute',
                    top: `${margins.top}px`,
                    left: `${margins.left}px`,
                }}
            />
        </>
    );
}

export default memo(TimelineDropsChart);

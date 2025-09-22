import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pen, Eraser, Square, Circle, Type, 
  Undo, Redo, Trash2, Download, 
  Palette, PenTool, Move 
} from 'lucide-react';

interface WhiteboardProps {
  width?: number;
  height?: number;
  isReadOnly?: boolean;
  sessionId?: string;
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'move';

interface DrawingPath {
  id: string;
  tool: Tool;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  timestamp: number;
}

export default function VirtualWhiteboard({ 
  width = 800, 
  height = 600, 
  isReadOnly = false,
  sessionId 
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingPath[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingPath[][]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
  ];

  const strokeWidths = [1, 2, 4, 8, 12];

  useEffect(() => {
    redrawCanvas();
  }, [paths]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    paths.forEach(path => {
      drawPath(ctx, path);
    });

    // Draw current path if drawing
    if (currentPath && isDrawing) {
      drawPath(ctx, currentPath);
    }
  };

  const drawPath = (ctx: CanvasRenderingContext2D, path: DrawingPath) => {
    if (path.points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (path.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);

    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }

    if (path.tool === 'rectangle' && path.points.length >= 2) {
      const start = path.points[0];
      const end = path.points[path.points.length - 1];
      ctx.clearRect(0, 0, 0, 0); // Reset path
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (path.tool === 'circle' && path.points.length >= 2) {
      const start = path.points[0];
      const end = path.points[path.points.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.clearRect(0, 0, 0, 0); // Reset path
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    }

    ctx.stroke();
    ctx.restore();
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;

    const pos = getMousePos(e);
    setIsDrawing(true);

    const newPath: DrawingPath = {
      id: Date.now().toString(),
      tool: currentTool,
      points: [pos],
      color: strokeColor,
      strokeWidth: strokeWidth,
      timestamp: Date.now()
    };

    setCurrentPath(newPath);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPath || isReadOnly) return;

    const pos = getMousePos(e);
    const updatedPath = {
      ...currentPath,
      points: [...currentPath.points, pos]
    };

    setCurrentPath(updatedPath);
    redrawCanvas();
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentPath) return;

    setIsDrawing(false);
    
    // Save current state for undo
    setUndoStack(prev => [...prev, paths]);
    setRedoStack([]);
    
    // Add completed path
    setPaths(prev => [...prev, currentPath]);
    setCurrentPath(null);
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [paths, ...prev]);
    setPaths(previousState);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[0];
    setUndoStack(prev => [...prev, paths]);
    setPaths(nextState);
    setRedoStack(prev => prev.slice(1));
  };

  const clearCanvas = () => {
    setUndoStack(prev => [...prev, paths]);
    setRedoStack([]);
    setPaths([]);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <PenTool className="h-5 w-5 mr-2 text-primary" />
            Virtual Whiteboard
          </CardTitle>
          <div className="flex items-center space-x-2">
            {sessionId && (
              <Badge variant="outline" className="text-xs">
                Session: {sessionId.substring(0, 8)}
              </Badge>
            )}
            {isReadOnly && (
              <Badge variant="secondary" className="text-xs">
                Read Only
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Toolbar */}
        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
            {/* Tools */}
            <div className="flex items-center space-x-1">
              {[
                { tool: 'pen' as Tool, icon: Pen, label: 'Pen' },
                { tool: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
                { tool: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
                { tool: 'circle' as Tool, icon: Circle, label: 'Circle' },
                { tool: 'text' as Tool, icon: Type, label: 'Text' },
                { tool: 'move' as Tool, icon: Move, label: 'Move' }
              ].map(({ tool, icon: Icon, label }) => (
                <Button
                  key={tool}
                  variant={currentTool === tool ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool(tool)}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-1">
              <Palette className="h-4 w-4 text-muted-foreground" />
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={`w-6 h-6 rounded border-2 ${
                    strokeColor === color ? 'border-primary' : 'border-muted'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div className="flex items-center space-x-1">
              {strokeWidths.map(width => (
                <Button
                  key={width}
                  variant={strokeWidth === width ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStrokeWidth(width)}
                  className="w-8 h-8 p-0"
                >
                  <div
                    className="rounded-full bg-current"
                    style={{ width: `${width}px`, height: `${width}px` }}
                  />
                </Button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={undoStack.length === 0}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={redoStack.length === 0}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                disabled={paths.length === 0}
                title="Clear All"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCanvas}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="block cursor-crosshair"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Tool: {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} | 
            Color: {strokeColor} | 
            Width: {strokeWidth}px
          </span>
          <span>
            Paths: {paths.length} | 
            Undo: {undoStack.length} | 
            Redo: {redoStack.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
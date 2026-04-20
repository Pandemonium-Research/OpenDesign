'use client';

interface CanvasPreviewProps {
  html: string;
}

export function CanvasPreview({ html }: CanvasPreviewProps) {
  if (!html) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-600">
        <div className="text-center">
          <div className="text-6xl mb-4">✦</div>
          <p className="text-lg font-medium text-slate-500">Enter a prompt to generate a prototype</p>
          <p className="text-sm text-slate-600 mt-1">Your design will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      className="w-full h-full border-0 rounded-lg"
      sandbox="allow-scripts"
      title="Prototype preview"
    />
  );
}

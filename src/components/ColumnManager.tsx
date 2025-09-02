import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
  SortableContext as SortableContextType,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, RotateCcw, Settings } from "lucide-react";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border hover:bg-surface-elevated transition-colors">
        <div
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-foreground-muted hover:text-foreground transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        {children}
      </div>
    </div>
  );
}

interface ColumnManagerProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ColumnManager({ columns, onColumnsChange, isOpen, onClose }: ColumnManagerProps) {
  const [localColumns, setLocalColumns] = useState(columns);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = localColumns.findIndex((col) => col.key === active.id);
      const newIndex = localColumns.findIndex((col) => col.key === over?.id);

      setLocalColumns(arrayMove(localColumns, oldIndex, newIndex));
    }
  };

  const resetToDefault = () => {
    const defaultColumns: ColumnConfig[] = [
      { key: "category", label: "Category", visible: true },
      { key: "subCategory", label: "Sub Category", visible: true },
      { key: "team", label: "Team", visible: true },
      { key: "status", label: "Status", visible: true },
      { key: "type", label: "Type", visible: true },
    ];
    setLocalColumns(defaultColumns);
  };

  const handleSave = () => {
    onColumnsChange(localColumns);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Column Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-foreground-muted">
            Drag and drop to reorder columns. All columns are currently visible.
          </p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map(col => col.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localColumns.map((column) => (
                  <SortableItem key={column.key} id={column.key}>
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{column.label}</span>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={resetToDefault} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ColumnManagerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="icon" onClick={onClick}>
      <Settings className="w-4 h-4" />
    </Button>
  );
}
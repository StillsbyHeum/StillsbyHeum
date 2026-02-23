import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { DEFAULT_SLOTS } from '../../constants';

const ScheduleTab: React.FC = () => {
    const { content, updateContent } = useAppContext();

    return (
        <div className="space-y-8">
            <h3 className="font-bold text-xl">Manage Schedule</h3>
            <p className="text-sm text-stone-500">Block specific dates or time slots.</p>
            
            <div className="flex gap-4 items-end">
                <div>
                    <label className="text-xs font-bold block mb-1">Select Date</label>
                    <input type="date" className="p-3 border rounded-xl" onChange={(e) => {
                        const date = e.target.value;
                        if (!content.schedule?.find(s => s.date === date)) {
                            const newSchedule = [...(content.schedule || []), { date, slots: DEFAULT_SLOTS.map(t => ({ time: t, isBlocked: false, isBooked: false, id: `${date}-${t}` })) }];
                            updateContent('schedule', '', newSchedule);
                        }
                    }} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.schedule?.map(day => (
                    <div key={day.date} className="border border-stone-200 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold">{day.date}</h4>
                            <button onClick={() => updateContent('schedule', '', content.schedule?.filter(s => s.date !== day.date))} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {day.slots.map(slot => (
                                <button 
                                    key={slot.time} 
                                    onClick={() => {
                                        const newSchedule = content.schedule!.map(s => {
                                            if (s.date === day.date) {
                                                return { ...s, slots: s.slots.map(sl => sl.time === slot.time ? { ...sl, isBlocked: !sl.isBlocked } : sl) };
                                            }
                                            return s;
                                        });
                                        updateContent('schedule', '', newSchedule);
                                    }}
                                    className={`py-2 text-[10px] font-bold rounded-lg transition-colors ${slot.isBlocked ? 'bg-red-100 text-red-500' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
                                >
                                    {slot.time}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleTab;

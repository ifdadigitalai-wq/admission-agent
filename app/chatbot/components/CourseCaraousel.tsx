"use client";

type Course = {
  id: string;
  name: string;
  description: string;
  image: string;
  link: string;
  duration: string;
  fee: string;
};

export default function CourseCarousel({
  courses,
  onInterested,
}: {
  courses: Course[];
  onInterested: (name: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {courses.map((course) => (
        <div
          key={course.id}
          className="min-w-[240px] bg-gray-900 border border-gray-700 rounded-xl p-3 flex flex-col"
        >
          <img
            src={course.image}
            alt={course.name}
            className="h-32 w-full object-cover rounded-lg mb-2"
          />

          <h3 className="text-sm font-semibold">{course.name}</h3>

          <p className="text-xs text-gray-400 line-clamp-2">
            {course.description}
          </p>

          <div className="text-xs mt-2 text-gray-300">
            ⏱ {course.duration}
          </div>

          <div className="text-xs text-green-400 font-medium">
            💰 {course.fee}
          </div>

          <button
            onClick={() => onInterested(course.name)}
            className="mt-2 bg-blue-600 text-xs py-1 rounded-lg hover:bg-blue-700"
          >
            I'm Interested
          </button>
        </div>
      ))}
    </div>
  );
}